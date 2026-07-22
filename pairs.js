// ============================================================================
// RECORD YOUR URL PAIRS HERE
// ----------------------------------------------------------------------------
// Each entry is one photo served through both CDN configs:
//
//   { config1: "<URL from CDN config 1>", config2: "<URL from CDN config 2>" }
//
// Add up to 30 (or any number — the app adapts to the list length).
//
// Notes:
//  - The order of config1/config2 here does NOT leak to voters: which one
//    appears on top vs bottom is randomized per pair, per session.
//  - Pairs are shown in the order listed below.
//  - Changing this list resets any in-progress voting session on a device.
// ============================================================================

// Names shown ONLY on the results screen (the test itself stays blind).
window.CONFIG_NAMES = {
  config1: "Config 1",
  config2: "Config 2",
};

// Hosting mode:
//   false → running behind "node server.js": votes stream to the live
//           organizer dashboard at /aggregate.
//   true  → static hosting (GitHub Pages, Netlify, any file host — no
//           backend): results stay on each voter's device; collect their
//           screenshots or CSV/JSON exports instead.
// Auto-detects GitHub Pages. Hardcode to true if you host statically
// somewhere else (Netlify, S3, …); hardcode to false never needed.
window.STATIC_MODE = /\.github\.io$/.test(location.hostname);

window.PAIRS = [
  // --- DEMO DATA — replace with your 30 real pairs -------------------------
  // (config2 uses a blur param to fake a "worse" CDN config so the flow is
  //  testable immediately; pair 4 is intentionally identical → sanity check
  //  that voters use "Can't tell".)
  { config1: "https://picsum.photos/id/1011/900/1400", config2: "https://picsum.photos/id/1011/900/1400?blur=2" },
  { config1: "https://picsum.photos/id/1015/900/1400?blur=1", config2: "https://picsum.photos/id/1015/900/1400" },
  { config1: "https://picsum.photos/id/1016/900/1400", config2: "https://picsum.photos/id/1016/900/1400?blur=1" },
  { config1: "https://picsum.photos/id/1025/900/1400", config2: "https://picsum.photos/id/1025/900/1400" },
  { config1: "https://picsum.photos/id/1035/900/1400?blur=2", config2: "https://picsum.photos/id/1035/900/1400" },
  { config1: "https://picsum.photos/id/1043/900/1400", config2: "https://picsum.photos/id/1043/900/1400?blur=1" },
  { config1: "https://picsum.photos/id/1057/900/1400?blur=1", config2: "https://picsum.photos/id/1057/900/1400" },
  { config1: "https://picsum.photos/id/1062/900/1400", config2: "https://picsum.photos/id/1062/900/1400?blur=2" },
];
