#!/usr/bin/env node
/*
 * Photo QC server — zero dependencies, no build step.
 *
 *   node server.js          (PORT=xxxx to override, default 8080)
 *
 * Serves the voting app (/) and organizer dashboard (/aggregate), and
 * aggregates voter submissions:
 *   POST /api/submit   — upsert one voter session (keyed by sessionId);
 *                        the app calls this after every vote, so the
 *                        dashboard updates live
 *   GET  /api/results  — all stored sessions as JSON
 *
 * Storage: one JSON file per session in ./data/ — delete files (or the
 * whole folder) to reset the demo.
 */
'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const PORT = Number(process.env.PORT) || 8080;
const MAX_BODY = 1000000;
const PICKS = ['config1', 'config2', 'tie', 'skip'];

fs.mkdirSync(DATA, { recursive: true });
let tmpSeq = 0;   // unique tmp per request so concurrent same-session upserts never collide

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' });
  res.end(body);
}
function jsonOut(res, code, obj) { send(res, code, JSON.stringify(obj)); }

function handleSubmit(req, res) {
  let size = 0;
  const chunks = [];
  req.on('data', function (c) {
    size += c.length;
    if (size > MAX_BODY) { req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', function () {
    let p;
    try { p = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch (e) { return jsonOut(res, 400, { error: 'bad json' }); }
    if (!p || typeof p.sessionId !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(p.sessionId))
      return jsonOut(res, 400, { error: 'bad sessionId' });
    if (!Array.isArray(p.votes) || p.votes.length > 1000)
      return jsonOut(res, 400, { error: 'bad votes' });

    const rec = {
      sessionId: p.sessionId,
      name: String(p.name || '').slice(0, 80),
      hash: String(p.hash || '').slice(0, 32),
      totalPairs: Math.max(0, Number(p.totalPairs) || 0),
      votes: p.votes.map(function (v) {
        return {
          pair: Math.max(0, Number(v && v.pair) | 0),
          pick: PICKS.indexOf(v && v.pick) >= 0 ? v.pick : 'skip',
          top: (v && v.top) === 'config2' ? 'config2' : 'config1',
          ms: Math.max(0, Number(v && v.ms) || 0),
        };
      }),
      submittedAt: new Date().toISOString(),
    };

    // atomic upsert: one file per session, tmp+rename so readers never see a torn write
    const file = path.join(DATA, rec.sessionId + '.json');
    const tmp = file + '.' + process.pid + '.' + (tmpSeq++) + '.tmp';
    fs.writeFile(tmp, JSON.stringify(rec), function (err) {
      if (err) return jsonOut(res, 500, { error: 'write failed' });
      fs.rename(tmp, file, function (err2) {
        if (err2) return jsonOut(res, 500, { error: 'write failed' });
        jsonOut(res, 200, { ok: true });
      });
    });
  });
  req.on('error', function () {});
}

function handleResults(res) {
  try {
    const sessions = fs.readdirSync(DATA)
      .filter(function (f) { return f.endsWith('.json'); })
      .map(function (f) {
        try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); }
        catch (e) { return null; }
      })
      .filter(Boolean)
      .sort(function (a, b) { return String(a.submittedAt).localeCompare(String(b.submittedAt)); });
    jsonOut(res, 200, { sessions: sessions });
  } catch (e) {
    jsonOut(res, 500, { error: 'read failed' });
  }
}

/*
 * Image proxy (GET /img?u=<encoded url>).
 *
 * CDNs negotiate output by request headers (Accept, User-Agent), and
 * browsers cannot send an app's User-Agent — so the app requests images
 * through this proxy, which replays the exact headers recorded in
 * pairs.js's REQUEST_HEADERS for that URL's config. Closed proxy: only
 * URLs literally present in pairs.js are allowed.
 */
let pairsCache = { mtime: -1, urlCfg: new Map(), headers: {} };
function pairsData() {
  try {
    const p = path.join(ROOT, 'pairs.js');
    const mt = fs.statSync(p).mtimeMs;
    if (mt !== pairsCache.mtime) {
      const sandbox = { window: {}, location: { hostname: 'server' } };
      vm.createContext(sandbox);
      vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { timeout: 1000 });
      const map = new Map();
      (Array.isArray(sandbox.window.PAIRS) ? sandbox.window.PAIRS : []).forEach(function (pr) {
        if (pr && typeof pr.config1 === 'string') map.set(pr.config1, 'config1');
        if (pr && typeof pr.config2 === 'string') map.set(pr.config2, 'config2');
      });
      pairsCache = { mtime: mt, urlCfg: map, headers: sandbox.window.REQUEST_HEADERS || {} };
    }
  } catch (e) { /* keep last good cache */ }
  return pairsCache;
}

const PROXY_HDR_ALLOW = ['accept', 'accept-language', 'accept-encoding', 'user-agent', 'referer'];

function handleProxy(req, res, rawQuery) {
  const target = new URLSearchParams(rawQuery).get('u') || '';
  const data = pairsData();
  const cfg = data.urlCfg.get(target);
  if (!cfg) return send(res, 403, 'url not in pairs.js', 'text/plain');
  const spec = data.headers[cfg] || {};
  const headers = {};
  Object.keys(spec).forEach(function (k) {
    if (PROXY_HDR_ALLOW.indexOf(k.toLowerCase()) >= 0) headers[k] = String(spec[k]);
  });
  fetchUpstream(target, headers, 0, res);
}

function fetchUpstream(target, headers, depth, res) {
  let u;
  try { u = new URL(target); } catch (e) { return send(res, 400, 'bad url', 'text/plain'); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return send(res, 400, 'bad url', 'text/plain');
  const mod = u.protocol === 'https:' ? https : http;
  const up = mod.get(u, { headers: headers }, function (ur) {
    if ([301, 302, 303, 307, 308].indexOf(ur.statusCode) >= 0 && ur.headers.location && depth < 3) {
      ur.resume();
      let next;
      try { next = new URL(ur.headers.location, u).href; }
      catch (e) { return send(res, 502, 'bad redirect', 'text/plain'); }
      return fetchUpstream(next, headers, depth + 1, res);
    }
    const h = { 'Cache-Control': ur.headers['cache-control'] || 'public, max-age=300' };
    ['content-type', 'content-length', 'content-encoding'].forEach(function (k) {
      if (ur.headers[k]) h[k] = ur.headers[k];
    });
    res.writeHead(ur.statusCode || 502, h);
    ur.pipe(res);
  });
  up.setTimeout(25000, function () { up.destroy(new Error('timeout')); });
  up.on('error', function () {
    if (!res.headersSent) send(res, 502, 'upstream error', 'text/plain');
    else res.destroy();
  });
}

function serveStatic(req, res) {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); }
  catch (e) { return send(res, 400, 'bad request', 'text/plain'); }
  if (urlPath.indexOf('\x00') !== -1) return send(res, 400, 'bad request', 'text/plain');   // NUL makes fs.readFile throw synchronously
  if (urlPath === '/') urlPath = '/index.html';
  if (urlPath === '/aggregate') urlPath = '/aggregate.html';

  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT + path.sep)) return send(res, 403, 'forbidden', 'text/plain');
  if (file.startsWith(DATA + path.sep) || file === DATA) return send(res, 403, 'forbidden', 'text/plain');
  if (path.basename(file) === 'server.js') return send(res, 403, 'forbidden', 'text/plain');

  fs.readFile(file, function (err, buf) {
    if (err) return send(res, 404, 'not found', 'text/plain');
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      return res.end();
    }
    send(res, 200, buf, type);
  });
}

http.createServer(function (req, res) {
  try {
    const parts = req.url.split('?');
    const u = parts[0];
    if (req.method === 'POST' && u === '/api/submit') return handleSubmit(req, res);
    if (req.method === 'GET' && u === '/api/results') return handleResults(res);
    if (req.method === 'GET' && u === '/img') return handleProxy(req, res, parts.slice(1).join('?'));
    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
    send(res, 405, 'method not allowed', 'text/plain');
  } catch (e) {
    try { send(res, 500, 'server error', 'text/plain'); } catch (e2) {}
  }
}).listen(PORT, function () {
  console.log('Photo QC running:');
  console.log('  voting:     http://localhost:' + PORT);
  console.log('  dashboard:  http://localhost:' + PORT + '/aggregate');
  const nets = os.networkInterfaces();
  Object.keys(nets).forEach(function (k) {
    (nets[k] || []).forEach(function (n) {
      if (n.family === 'IPv4' && !n.internal)
        console.log('  on phones:  http://' + n.address + ':' + PORT);
    });
  });
});
