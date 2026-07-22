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
const fs = require('fs');
const path = require('path');
const os = require('os');

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
    const u = req.url.split('?')[0];
    if (req.method === 'POST' && u === '/api/submit') return handleSubmit(req, res);
    if (req.method === 'GET' && u === '/api/results') return handleResults(res);
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
