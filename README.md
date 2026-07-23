# Photo QC — CDN config A/B comparison

A tiny, dependency-free web app for blind side-by-side comparison of two CDN
parameter configs across ~30 photos. Voters tap the photo that looks clearer;
results show which config won.

## 1. Record your data

Edit **`pairs.js`** — this is the single source of truth. One entry per photo:

```js
window.PAIRS = [
  { config1: "https://cdn.example.com/photo1.jpg?q=80", config2: "https://cdn.example.com/photo1.jpg?q=60" },
  // ... up to 30 (any count works)
];
```

Optionally set display names (shown only on the results screen):

```js
window.CONFIG_NAMES = { config1: "Baseline", config2: "New params" };
```

The file ships with 8 demo pairs (picsum + blur) so you can try the flow
immediately — replace them with your real URLs.

## 2. Run it

```bash
node server.js
```

No dependencies, no build step. The server prints the URLs, including the
LAN address to open on phones (same Wi-Fi):

- **Voting app**: `http://<your-mac-ip>:8080` — share this with voters
- **Organizer dashboard**: `http://<your-mac-ip>:8080/aggregate` — live
  aggregate results across all voters (keep this to yourself; showing voters
  the running tally would bias them)

`PORT=3000 node server.js` to change the port.

**Header-faithful fetching**: CDNs negotiate the returned format via request
headers (`Accept`, `User-Agent`) — a desktop browser can receive different
bytes than the app you're evaluating. Record the app's captured request
headers per config in `REQUEST_HEADERS` in `pairs.js`; in server mode those
configs are fetched through the server's `/img` proxy with exactly those
headers. Browsers forbid pages from setting `User-Agent`, so static hosting
(Option B) always uses the browser's own headers — use server mode when
header fidelity matters.

### Option B: static hosting — no server, no laptop, always on

If you don't need the live aggregate dashboard, the app runs as plain static
files — host `index.html` + `pairs.js` anywhere: **GitHub Pages**, Netlify,
Vercel, or any file host. Voters open the public URL from anywhere; nothing
depends on your Mac.

`STATIC_MODE` in `pairs.js` switches the app's behavior. It auto-enables on
`*.github.io`; for other static hosts set it to `true` manually. Locally
(and anywhere else) it stays `false`, so `node server.js` keeps its live
dashboard.

In this mode there are no submissions and no `/aggregate` — each voter's
results screen asks them to send you a screenshot or the CSV export, and you
tally those. Voting, zoom, undo, early-end, and per-device persistence all
work identically.

Notes for GitHub Pages: the repo must be public on a free account (private
repos need a paid plan for Pages) — remember `pairs.js` with your CDN URLs
will be visible in it. `server.js`/`aggregate.html` can stay in the repo;
they're simply unused.

## 3. How the test works

- **Blind + unbiased**: config names are never shown during voting, and which
  config appears on top vs bottom is randomized per pair per session.
- **Tap to vote** the clearer photo; **🤷 Can't tell** records a tie.
- **Pinch to zoom** (or mouse-wheel on desktop) — both photos zoom and pan in
  sync so you compare the same region. Tap still votes while zoomed.
- **↺ Undo** reverts the last vote. **End & results** works at any point —
  sessions don't have to reach all 30 pairs.
- Progress is saved in `localStorage`, so an interrupted session resumes.
- Failed image loads offer **Retry** / **Skip pair**; skips are excluded from
  the win percentages.

## 4. Results

**Per voter** (on their device): win counts + percentages per config,
ties/skips, average decision time, and a per-pair table. Export via
**Copy JSON** or **Download CSV**.

**Aggregated** (organizer dashboard at `/aggregate`): the app pushes each
voter's session to the server after every vote, so the dashboard updates
live — voter count, overall config1 vs config2 split, per-pair breakdown
with thumbnails, per-voter progress table, and a CSV export of every vote
from every voter. Voters can optionally enter their name on the intro
screen; unnamed sessions show as `anon-xxxxxx`.

Sharing is best-effort: if the server is unreachable, voting continues
unaffected (results stay in localStorage) and the results screen says so.

### Storage & reset

Submissions are stored as one JSON file per session in `data/` (created
automatically, keyed by a random session id). To reset the demo:

```bash
rm -rf data
```

Changing `pairs.js` invalidates saved sessions automatically (content hash);
the dashboard likewise excludes submissions recorded against an older
`pairs.js` and says how many it excluded.

### Deploying beyond the LAN

`server.js` is a plain Node HTTP server — it runs anywhere Node runs
(a VPS, Railway, Fly.io, Render). It is **not** directly deployable to
Vercel/Netlify serverless (they have no persistent filesystem); that would
need swapping the file storage for Blob/KV storage. For a ~30-person demo,
running it on a laptop on the venue Wi-Fi is usually all you need.
