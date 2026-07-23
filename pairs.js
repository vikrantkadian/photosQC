// ============================================================================
// RECORD YOUR URL PAIRS HERE
// ----------------------------------------------------------------------------
// Each entry is one photo served through both CDN configs:
//
//   { config1: "<URL from CDN config 1>", config2: "<URL from CDN config 2>" }
//
// Notes:
//  - The order of config1/config2 here does NOT leak to voters: which one
//    appears on top vs bottom is randomized per pair, per session.
//  - Pairs are shown in the order listed below.
//  - Changing this list resets any in-progress voting session on a device.
//
// Current data: imported 2026-07-23 from
// "Image Comparison Sheet with Similar Players - Live Sheet.csv" (30 pairs).
// ============================================================================

// Names shown ONLY on the results screen (the test itself stays blind).
window.CONFIG_NAMES = {
  config1: "Config 1 (iOS)",
  config2: "Config 2 (iOS)",
};

// Request headers to replay when fetching images (captured from the real
// apps). With "node server.js", any config listed here has its images
// proxied through the server with EXACTLY these headers — reproducing the
// bytes the app receives (CDNs negotiate format via Accept / User-Agent;
// measured 2026-07-23: mmtcdn serves WebP to the app's headers but AVIF to
// a desktop browser's). Static hosting (GitHub Pages) cannot replay these:
// browsers forbid pages from setting User-Agent, so there images load with
// the browser's own headers.
window.REQUEST_HEADERS = {
  config1: {   // MakeMyTrip iOS app, captured 2026-07-23
    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent": "MakeMyTrip/10.3.0 (iPhone; iOS 26.5; Scale/3.00)"
  }
  // config2: { ... } ← paste the Cleartrip iOS app's captured headers here
  // if needed (measured 2026-07-23: rukmini-ct returns identical bytes for
  // app vs browser headers, so direct loading is currently faithful).
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
  { config1: "https://r2imghtlak.mmtcdn.com/r2-mmt-htl-image/htl-imgs/202312221020535437-e81855aa-6a1a-4721-8fd5-ec303bf4608b.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_58ea1b4a-d939-4fee-b7b8-d5af27410b16.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/ef00c0ed-be15-4ab3-b266-8dc586c7eea2.jpeg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_cad8ec1c-cc23-46c4-a5b2-4f29c2c06cd0.jpeg" },
  { config1: "https://r2imghtlak.mmtcdn.com/r2-mmt-htl-image/htl-imgs/201606272320021734-ba124e64917411e78cd70224510f5e5b.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_8974db72-1cb9-48f0-932a-09c0acfef3ba.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/a5d9d7d6712211e7ad1e0a4cef95d023.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_1f8c5039-1517-44f0-b9e9-75243f4564cf.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/8ae36ec9-fafc-4550-957e-7309f384419b.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_fbd48dfd-d4b6-4e39-8643-54f215e0ad3d.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/deada8ac71df11ee9fdc0a58a9feac02.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_caf34ddb-bd3f-44e8-9b9e-7e8e74ff48de.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/b6f19372-9fe5-4e9a-896a-0f133153bf8a.jpeg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_4ea52929-19ea-4a3f-b39b-263bea52b251.jpeg" },
  { config1: "https://r2imghtlak.mmtcdn.com/r2-mmt-htl-image/htl-imgs/202206231347004584-e72a9770f87c11ec8e620a58a9feac02.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_34132ac6-2fe1-47e0-8488-dcd6f3cc7de0.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/74fcb92a-87ad-4287-baf7-9b396f2956b9.jpeg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_474eba3b-95a1-4848-98f1-ae7bb5ad2234.jpeg" },
  { config1: "https://r2imghtlak.mmtcdn.com/r2-mmt-htl-image/htl-imgs/201712081117557563-8f319844-9e53-4773-b454-f73b4a0f8090.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_15b70fe7-4b6a-41c8-b4bf-83c17b2c6440.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/f7bbfd91-ed00-4129-b352-45b6583d57a1.png?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_831209b2-c5c7-457b-bd15-192fcf0ae98c.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/3605cb706f1b11eda4560a58a9feac02.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_e3ef4d5a-cf0c-4492-9c78-f5b89da66d4d.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/07f94037-97a1-4d5a-b372-84a28943e158.png?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_b8fe9903-bb64-41c8-a074-e629e3a94ec3.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/1dce80eb-a52c-4142-85e1-c505744b3042.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_e36fa441-f22a-4da3-b3b3-b57b37224ac9.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/40146712-4883-4c6e-bb1a-8e560472fd85.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_99c832e5-2b5e-4522-9b33-ddae1c5cb0ae.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/624708208fa711ebba930242ac110003.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_80d04e64-b265-4d3b-8d44-52201af809ba.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/27dd47d616c911f197740a58a9feac02.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_5c76ec64-63d4-484c-9b86-34d238753826.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/ac5d1423-38fc-4f82-baed-a8e48357a5a4.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_c8d2f179-b5fb-4a67-b686-548063fa50e1.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/a962280eac2d11ecb3460a58a9feac02.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_277b0948-23a7-4fe3-b014-d8dacd50905b.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/16520a98-11d4-49cf-afa4-c856bfbeed4f.png?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_bf0fb834-2e0e-420f-83c3-2010b107d22a.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/533eca72b6d811eb8c2f0242ac110005.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_88f41216-3467-4c72-9b71-311998f775b9.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/ea946cf8-edba-4c65-ba38-0218cc876a42.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_e09d766f-1c89-4bb3-a671-240c7e7f3d53.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/6d976176-5ffd-4af7-99ca-28be14d8a776.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_96735766-453e-48ea-b589-7ab75eb98a6e.jpeg" },
  { config1: "https://r2imghtlak.mmtcdn.com/r2-mmt-htl-image/htl-imgs/201808231709387565-7ae470b0-4cbc-4f12-a412-5e7c6ce2fd75.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_e331fc7f-0797-47dc-a110-59de47baaeb1.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/c41d5b52-4b1d-4bb2-98e4-5fdc022e8ff2.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_dfab5c94-3718-49a3-9c09-f52d2b00e157.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/db5fbcc0b5d311e4887cdaf4768ad8d9.jfif?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_3deff8a2-4c27-4449-bc89-f077189c9ab3.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/5b191a5a-1820-4c40-a58a-28a1aecc31f4.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_bd5a4b17-8514-4f36-9b12-809a49631d32.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/5ef86976-b47f-467a-a22a-e492b818828a.jpg?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_f0fe9c84-f103-4048-bdfc-8f8762105fc7.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/cd540d4650d311ec90730a58a9feac02.jfif?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_2bc18b18-52b6-4bb7-a721-bbf2e61af7ca.jpeg" },
  { config1: "https://r1imghtlak.mmtcdn.com/b61d15d2704611eb843f0242ac110003.jfif?output-format=jpg&downsize=720:*",
    config2: "https://rukmini-ct.flixcart.com/q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto/ct-hotel-images/places/hotels/cms/2052/2052464/images/image_2052464_e74dff00-f984-4007-a803-11b6ebae9626.jpeg" },
];
