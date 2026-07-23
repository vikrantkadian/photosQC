# Image Quality Analysis — MMT vs Cleartrip iOS CDN configs

*2026-07-23 (rev 2 — adds the neutral-reference double-check, corrects the
perceptibility metric, and documents the 4-set ordering). All measurements
made on the app-faithful bytes frozen in `snapshot/` (fetched with each iOS
app's captured request headers, SHA-256-verified). Config 1 = MakeMyTrip,
Config 2 = Cleartrip. Objective proxy metrics — the blind votes collected
by this tool remain the arbiter of perceived quality.*

**Pair numbering**: pairs were re-ordered on 2026-07-23 into perceptibility
sets (below). Tables here use the NEW numbers; original sheet row in parens.

## 1. What each app is actually served

| | Config 1 (MMT) | Config 2 (Cleartrip) |
|---|---|---|
| URL params | `output-format=jpg&downsize=720:*` | `q_75,w_420,h_300,fl_progressive,e_sharpen:80,c_fill,dpr_2,f_auto` |
| Format received by app | WebP (25 of 30) / JPEG (5 of 30) | JPEG ×30 — never WebP |
| Dimensions | 720 wide, native-ish aspect | always 840×600 (`c_fill` 1.4:1) |
| Avg payload | 81 KB (min 34, max 189) | 88 KB (min 47, max 155) |
| Bytes per pixel | 0.234 | 0.180 |
| Smaller file in a pair | 24 of 30 | 6 of 30 |

Header facts (verified against Charles captures from both apps): Cleartrip's
`Accept: image/*` never advertises WebP, so `f_auto` always falls back to
JPEG for the app (the CDN serves WebP to browser Accept headers — `Vary:
Accept`). Both apps run on 3× displays (`Scale/3.00`); Cleartrip requests
`dpr_2`, under-serving its own screens. MMT's fixed 720 px is also below 3×
full-width needs.

## 2. Core finding, double-checked two ways

### 2a. No-reference sweep (all 30 pairs)

At a common 390 px display width, Cleartrip's rendition has **less detail
energy in 30/30 pairs** (13–48% of MMT's, Laplacian variance) and **more
8-px JPEG block-grid structure in 30/30 pairs**.

### 2b. Neutral-reference experiment (the stronger check)

Both platforms store the **same master** (verified on 4 sampled pairs by
resolution match, e.g. 4500×2894 both sides; Cleartrip's master is
reachable at `q_100` unresized, MMT's at the query-less URL). For pairs
with aligned geometry, each platform's rendition was compared against a
*neutral high-quality browser downscale of that shared master*:

| Pair (new/old) | Neutral ref | MMT rendition | CT rendition |
|---|---:|---:|---:|
| 1/1 | 2260 | **4749 (2.1× ref)** | 1345 (0.64× its ref) |
| 29/6 | 654 | **794 (1.2× ref)** | 545 (0.82× its ref) |
| 5/10 | 1040 | **2519 (2.4× ref)** | 609 (0.57× its ref) |

Two distinct mechanisms, compounding:

- **MMT actively sharpens** — its output lands well *above* a neutral
  resize (Akamai Image Manager acutance enhancement). Consequence:
  slightly soft/blurry masters are visibly "rescued" on MMT.
- **Cleartrip's resize loses real detail** — its output lands *below* a
  neutral resize, before compression even matters.

Pipeline controls (verified on TWO different images, pairs 1/1 and 5/10):
`q_100` output is as soft as `q_75` (compression is not the cause), and
removing `e_sharpen:80` yields **pixel-identical output** — the sharpen
parameter is silently ignored by the rukmini pipeline. A `dpr_3` render
(1260×900) improves detail ~2× but still sits ~3.4× below MMT at equal
display size — the resize filter dominates.

Anomaly worth knowing: old pair 26's MMT rendition is a 3:2 crop of a 4:3
master — MMT's serving pipeline sometimes crops too (excluded from the
reference table for that reason).

## 3. Perceptibility ranking and the 4 sets

Lesson learned (from human spot-check): the *relative* detail ratio
under-ranks busy scenes. Old pair 26 keeps the highest fraction of MMT's
detail (48%) yet the difference is clearly visible, because detail-dense
scenes (windows, signage, railings) give the eye anchors and the
*absolute* detail loss there is large. Sets are therefore ranked by
**absolute detail deficit** at display scale.

| Set | New pairs | Old pairs | Character |
|---|---|---|---|
| **1 — clearest** | 1–8 | 1, 24, 30, 29, 10, 16, 19, 3 | large absolute loss; dusk/dim scenes & detail-dense architecture |
| **2** | 9–16 | 4, 18, 11, 12, 28, 21, 23, 17 | substantial loss, mixed content |
| **3** | 17–23 | 14, 20, 26, 8, 5, 13, 7 | moderate; includes the blocking showcase (new 20 / old 8: smooth pool/sky, blockiness 1.41) |
| **4 — subtlest** | 24–30 | 22, 9, 25, 2, 15, 6, 27 | smooth/simple scenes, smallest absolute loss |

Voters see no set labels (avoids priming); pairs simply run Set 1 → Set 4.
Full per-pair metrics, ranked (absLoss = MMT-minus-CT detail energy @390px):

| New | Old | absLoss | CT/MMT ratio | CT blockiness |
|---:|---:|---:|---:|---:|
| 1 | 1 | 7759 | 0.15 | 1.17 |
| 2 | 24 | 6194 | 0.13 | 1.18 |
| 3 | 30 | 5429 | 0.36 | 1.06 |
| 4 | 29 | 4762 | 0.32 | 1.04 |
| 5 | 10 | 4182 | 0.13 | 1.24 |
| 6 | 16 | 3911 | 0.31 | 1.10 |
| 7 | 19 | 3891 | 0.34 | 1.12 |
| 8 | 3 | 3753 | 0.17 | 1.16 |
| 9 | 4 | 3301 | 0.35 | 1.09 |
| 10 | 18 | 2706 | 0.32 | 1.11 |
| 11 | 11 | 2523 | 0.35 | 1.07 |
| 12 | 12 | 2489 | 0.36 | 1.09 |
| 13 | 28 | 2462 | 0.37 | 1.18 |
| 14 | 21 | 2165 | 0.36 | 1.12 |
| 15 | 23 | 1927 | 0.34 | 1.16 |
| 16 | 17 | 1707 | 0.30 | 1.22 |
| 17 | 14 | 1651 | 0.41 | 1.16 |
| 18 | 20 | 1577 | 0.32 | 1.22 |
| 19 | 26 | 1360 | 0.48 | 1.14 |
| 20 | 8 | 1215 | 0.18 | 1.41 |
| 21 | 5 | 1181 | 0.35 | 1.28 |
| 22 | 13 | 1116 | 0.31 | 1.30 |
| 23 | 7 | 1086 | 0.36 | 1.22 |
| 24 | 22 | 1050 | 0.35 | 1.28 |
| 25 | 9 | 974 | 0.41 | 1.21 |
| 26 | 25 | 736 | 0.42 | 1.25 |
| 27 | 2 | 718 | 0.40 | 1.27 |
| 28 | 15 | 651 | 0.47 | 1.17 |
| 29 | 6 | 629 | 0.46 | 1.33 |
| 30 | 27 | 554 | 0.39 | 1.29 |

## 4. Recommendations

For Cleartrip, in priority order:

1. **Fix `e_sharpen`** — verified no-op on two different images; the
   config intends sharpening that never happens.
2. **Fix the resize filter** — the dominant factor; output lands below
   even a neutral browser downscale of the same master.
3. **Request `dpr_3` on 3× devices** (app declares `Scale/3.00`, asks for
   `dpr_2`).
4. **Advertise `image/webp` in the app's `Accept`** — ~30–40% payload
   saving at equal quality; the CDN already negotiates it.
5. Re-run this blind test after each change.

For MMT: 720 px is below 3× full-width needs; 5 of 30 images fell back to
JPEG despite WebP support; note its pipeline sharpens deliberately —
that's a feature at these sizes, but keep halos in mind on high-contrast
edges.

## 5. Implications for the hypothesis ("MMT looks better")

Metrics predict voters should prefer MMT, most visibly in Set 1 — and
because MMT *sharpens* while Cleartrip *softens*, the gap should be
biggest on slightly soft masters and detail-dense scenes, especially when
zooming. The `/aggregate` dashboard computes an exact binomial test
(≈194 decided votes detect a true 60/40 split; ≈85 detect 65/35).
Per-pair rows on the dashboard can be read against the sets table above:
if Set 1 votes split decisively for MMT while Set 4 ties, that is exactly
the "certain kinds of images show the difference" argument.

Caveats: no-reference and reference metrics are proxies, not human
judgment; "neutral reference" = browser high-quality resample; `c_fill`
framing differences mildly affect per-pair comparability; root-cause
probes used 2–4 images, assumed representative of the pipelines.
