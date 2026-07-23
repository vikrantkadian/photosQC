# Image Quality Analysis — MMT vs Cleartrip iOS CDN configs

*2026-07-23. All measurements made on the app-faithful bytes frozen in
`snapshot/` (fetched with each iOS app's captured request headers and
SHA-256-verified against independent fetches). Config 1 = MakeMyTrip,
Config 2 = Cleartrip. These are objective proxy metrics — the blind votes
collected by this tool remain the arbiter of perceived quality.*

## 1. What each app is actually served

| | Config 1 (MMT) | Config 2 (Cleartrip) |
|---|---|---|
| URL params | `output-format=jpg&downsize=720:*` | `q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto` |
| Format received by app | WebP (25 of 30) / JPEG (5 of 30) | JPEG ×30 — never WebP |
| Dimensions | 720 wide, native aspect (avg 720×493) | always 840×600 (`c_fill` crop to 1.4:1) |
| Avg payload | 81 KB (min 34, max 189) | 88 KB (min 47, max 155) |
| Bytes per pixel | 0.234 | 0.180 |
| Smaller file in a pair | 24 of 30 | 6 of 30 |

Key header facts (verified against Charles captures from both apps):

- Cleartrip's app sends `Accept: image/*,*/*;q=0.8` — it never advertises
  WebP, so `f_auto` falls back to JPEG. The same CDN serves WebP when the
  header offers it (`Vary: Accept`). Browsers therefore see a *different*
  (WebP) rendition than app users.
- MMT's app advertises `image/webp` and mostly receives WebP; browsers
  receive AVIF. This is why a plain browser-side comparison misrepresents
  both configs, and why this tool replays headers / serves frozen bytes.
- Both apps report `Scale/3.00` (3× displays). Cleartrip requests `dpr_2`
  — under-serving its own screens. MMT's fixed 720 px is similarly below
  3× full-width needs.

## 2. Sharpness & blocking, per pair

Method: each image decoded and downscaled to a common 390 px display width;
detail energy = Laplacian variance of luma (higher = crisper). Blockiness =
mean luma discontinuity at 8-px column boundaries vs elsewhere at native
scale (1.0 = no visible JPEG grid). "CT detail" = Cleartrip's Laplacian as
a fraction of MMT's for the same pair.

**Cleartrip is softer in 30/30 pairs and blockier in 30/30 pairs.**

| Pair | CT detail (of MMT) | CT blockiness | MMT blockiness | Scene busyness | Brightness |
|---:|---:|---:|---:|---:|---:|
| 10 | 13% | 1.24 | 1.05 | 28.3 | dim (81) |
| 24 | 13% | 1.18 | 1.04 | 35.5 | dim (73) |
| 1 | 15% | 1.17 | 1.06 | 36.7 | dim (85) |
| 3 | 17% | 1.16 | 1.13 | 22.4 | mid (113) |
| 8 | 18% | **1.41** | 1.14 | 13.4 | bright (136) |
| 17 | 30% | 1.22 | 1.12 | 18.7 | bright (162) |
| 13 | 31% | 1.30 | 1.16 | 17.4 | mid (118) |
| 16 | 31% | 1.10 | 1.05 | 35.2 | mid (120) |
| 18 | 32% | 1.11 | 1.03 | 20.6 | dark (62) |
| 20 | 32% | 1.22 | 1.09 | 21.2 | mid (110) |
| 29 | 32% | 1.04 | 1.01 | 38.1 | mid (106) |
| 19 | 34% | 1.12 | 1.06 | 25.4 | mid (122) |
| 23 | 34% | 1.16 | 1.05 | 25.5 | mid (93) |
| 4 | 35% | 1.09 | 1.09 | 34.0 | bright (145) |
| 5 | 35% | 1.28 | 1.11 | 22.0 | dim (82) |
| 11 | 35% | 1.07 | 0.99 | 29.8 | dark (55) |
| 22 | 35% | 1.28 | 1.07 | 17.0 | mid (110) |
| 7 | 36% | 1.22 | 1.02 | 17.2 | mid (107) |
| 12 | 36% | 1.09 | 1.04 | 32.6 | mid (98) |
| 21 | 36% | 1.12 | 1.02 | 26.3 | mid (98) |
| 30 | 36% | 1.06 | 1.04 | 49.7 | bright (157) |
| 28 | 37% | 1.19 | 1.07 | 30.4 | mid (124) |
| 27 | 39% | 1.29 | 1.04 | 13.0 | mid (112) |
| 2 | 40% | 1.27 | 1.03 | 17.7 | mid (109) |
| 9 | 41% | 1.21 | 1.04 | 19.2 | mid (128) |
| 14 | 41% | 1.16 | 1.04 | 22.9 | bright (162) |
| 25 | 42% | 1.25 | 1.08 | 17.4 | bright (133) |
| 6 | 46% | 1.33 | 1.18 | 22.8 | dim (92) |
| 15 | 47% | 1.17 | 1.07 | 17.8 | dark (68) |
| 26 | 48% | 1.14 | 1.11 | 38.2 | dim (80) |

Reading the pattern:

- **Biggest MMT advantage** (pairs 10, 24, 1, 3, 8): detail-rich dusk/dim
  scenes and one smooth bright scene with severe blocking.
- **Worst Cleartrip blocking** (pairs 8, 6, 13, 27, 5, 2, 22): scenes with
  large smooth areas — skies, pool water, plain walls — where the 8-px
  JPEG grid is most visible.
- **Smallest gap** (pairs 26, 15, 6, 25): very busy or dark compositions
  where texture masks softness. Even there, Cleartrip retains under half
  of MMT's measured detail.

## 3. Root cause of Cleartrip's softness (controlled experiments, pair 1)

| Variant | Detail energy @390px |
|---|---:|
| MMT production (720 wide) | **9105** |
| Cleartrip production (`q_75`, 840×600) | 1346 |
| Cleartrip at `q_100` (654 KB!) | 1348 |
| Cleartrip without `e_sharpen:80` | 1346 — *pixel-identical to production* |
| Cleartrip at `dpr_3` (1260×900) | 2713 |

1. **Not the source**: both platforms store the *same 4500×2894 master*
   (Cleartrip's CDN returns it at `q_100` unresized; MMT's raw URL serves
   the identical resolution).
2. **Not compression**: `q_100` output is as soft as `q_75`.
3. **`e_sharpen:80` is a silent no-op**: removing it changes nothing —
   the parameter appears to be ignored by the rukmini pipeline. The config
   *intends* sharpening that never happens.
4. **The resize itself destroys detail**: even at 1260×900 the output has
   ~3.4× less detail than MMT's 720 px rendition at equal display size.
   The downscale filter over-smooths, while MMT's Akamai Image Manager
   preserves (or enhances) acutance.

## 4. Recommendations

For Cleartrip, in priority order:

1. **Fix `e_sharpen`** — it is doing nothing today; whoever tuned the URL
   believes images are sharpened. Verify parameter support/placement in
   the rukmini pipeline.
2. **Fix the resize filter** — the dominant factor. The downscaler loses
   ~2–8× of the detail Akamai retains from the same master.
3. **Request `dpr_3` on 3× devices** — the app declares `Scale/3.00` but
   asks for `dpr_2`.
4. **Advertise `image/webp` in the app's `Accept` header** — the CDN
   already negotiates WebP; this is a ~30–40% payload saving at equal
   quality, no server change required.
5. Re-run this blind test after each change.

For MMT: `downsize=720:*` is below 3× full-width display needs; and 5 of
30 images fell back to JPEG despite WebP support — worth checking why.

## 5. Implications for the hypothesis ("MMT looks better")

The objective metrics predict voters should prefer MMT — most strongly on
pairs 10, 24, 1, 3, 8 — especially when zooming (the app's synced pinch-
zoom exists for this). If blind votes still return "can't tell" at
fit-to-screen sizes, the conclusion is that Cleartrip's softness sits
below perceptual threshold in-feed, and the priority shifts to zoomed
views and payload efficiency. The `/aggregate` dashboard computes an exact
binomial test (needs ≈194 decided votes to detect a true 60/40 split,
≈85 for 65/35).

Caveats: no-reference proxy metrics, not human judgment; sharpness at one
display width; `c_fill` framing differences mildly affect per-pair
comparability; single-image root-cause probes (pair 1) assumed
representative of the pipeline.
