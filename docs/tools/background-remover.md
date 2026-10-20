# Background Remover (よしにゃに背景透過)

Week 14. Makes a single-colour background transparent: the colour is found
from the edges of each image, the edges of the subject are smoothed so no
fringe is left, and a whole batch saves as PNG. Everything runs in the browser:
`/ja/background-remover` and `/en/background-remover`.

## Where it came from

A client who had asked for a website build sent their logo as an image with a
coloured background. The design put the logo on a different colour, so the
background had to be made transparent. Doing that in an image editor means
selecting, deleting, cleaning up the fringe and exporting — per file.

The roadmap has AI subject cut-out at Week 47. That is a different job: it
needs a model of tens of megabytes, WebGPU, and a licence compatible with ads
and a paid plan. Removing a flat background colour needs none of that and
covers the logo case completely, so it ships now under a generic slug the AI
mode can later join.

## Problem being solved

- A logo on a white or coloured box looks wrong on any other colour.
- Magic-wand removal leaves a light jagged fringe along anti-aliased edges,
  which shows the moment the logo sits on a dark colour.
- Enclosed background — the inside of an O or an A — is not connected to the
  rest and survives a flood fill.
- The usual free services upload the image, which rules out unreleased logos
  and client material.

## Naming

JA `よしにゃに背景透過`, EN `Background Remover by Yoshinya`. The JA title leads
with `画像を透明PNGに一括変換` (30 full-width units) so it spends no words already
in the tool name; the EN title leads with `Transparent PNG Maker for Logos`.
The page copy says "single-colour background" rather than "white background":
any flat colour works, and claiming only white would undersell it.

## How the background is found

`detectBackground()` in `lib/remove.ts` reads the pixels along the four edges,
buckets them at 4 bits per channel, takes the commonest bucket, and returns the
**average** of that bucket rather than its corner — so `#FEFEFE` is matched as
`#FEFEFE`, not `#F0F0F0`. Bucketing absorbs JPEG noise.

- Coverage — the share of opaque edge pixels within tolerance of that colour —
  drives a warning below 50%: the background is probably not one colour.
- If at least half the edge is already transparent, there is no automatic
  colour; the page says the edges are already transparent and clicks still work.
- Each image is detected separately, so a batch with different background
  colours needs no setting changes.

## What gets cleared

Distance is RGB Euclidean, as a percentage of the largest possible distance.
The tolerance slider runs 0–50%, default 12%.

There is one model for everything: a list of **targets**, each a colour plus
seed pixels.

- The automatic target: the detected colour, seeded from every matching (or
  transparent) edge pixel.
- Each click adds a target: the clicked pixel's own colour, seeded at the
  click. That one mechanism covers both the inside of an O and a second
  background colour.

Two modes:

- **Only the background around the edges** (`connected`, default) — a
  4-connected flood fill from each target's seeds. Four, not eight, so a fill
  cannot leak through the diagonal gap between two touching strokes. A white
  logo on a white background keeps its white.
- **That colour everywhere in the image** (`global`) — every pixel within
  tolerance of any target colour, enclosed or not.

Transparent pixels are walked through but never claimed. Claiming them would
put an edge ring around the subject of an image that was already cut out, and
walking through them is what reaches a white halo inside a transparent margin.

## Smooth edges

An anti-aliased edge pixel is a blend of subject and background. Left as is,
it shows as a light line on a dark page. With *Smooth the edges* on, every
pixel within 2 px (8-connected) of the cleared area is split back into
background and foreground:

- `B` is the colour of the target that cleared the neighbouring pixel.
- `F`, the foreground sample, is the opaque pixel in the surrounding 5×5 that
  is furthest from `B` — the solid interior on a thick shape, the darkest pixel
  on a hairline.
- `alpha = (P − B)·(F − B) / |F − B|²`, clamped to 0–1: how far along the line
  from background to foreground the pixel sits.
- The colour becomes `B + (P − B) / alpha`, which removes the background's tint.
- The source alpha is multiplied in, so existing transparency is kept.

**Trap found while building it:** the first version used GIMP's "Color to
Alpha", which measures opacity against the extremes of the colour space rather
than against a foreground sample. On a pale pink shape with a hard edge it
read the edge as about 10% opaque and shaved two pixels off the shape. The test
`does not shave the hard edge of a pale subject` pins the fix.

The ring is limited to 2 px for the same reason: applied to the interior, any
pale part of the subject would turn see-through. Two pixels catch ordinary
anti-aliasing (1 px) plus images that were scaled up or saved as JPEG.

Off is for pixel art, where every edge should stay hard.

## Preview and saving

- Only the image on screen is decoded and held as pixels. Settings changes
  re-run the removal after a 120 ms debounce (the first draw of a new image is
  immediate) and draw straight to a canvas. PNG encoding happens only on save.
- The canvas is scaled with CSS only (both dimensions `auto` under max limits),
  so a click maps onto image pixels with one proportion.
- The backdrop — checkerboard, white, black — is drawn behind the canvas, never
  into it. Black shows a light fringe, white shows a dark one.
- *Show the original* is a toggle rather than press-and-hold, which does not
  work well on a phone.
- ZIP saving goes one image at a time — decode, clear, encode — so a 200-image
  batch only ever holds one image's pixels. Entries are stored, not deflated:
  PNG is already compressed. Images that cannot be decoded are left out and
  counted in a notice.
- Output is always PNG; the name keeps its base and gains `.png`. Collisions in
  the ZIP (`logo.jpg` and `logo.png`) are numbered.
- Decoding uses `createImageBitmap` with colour-space conversion and
  premultiplication off, so the colour read is the colour stored in the file.

Processing runs on the main thread. A 12-megapixel image takes a few hundred
milliseconds; if larger images make the slider feel slow, moving
`removeBackground()` into a Worker is a contained change, since it is a pure
function over a buffer.

## Limits

200 images, 30 MB per file, 500 MB in total, and 40 megapixels per image
(one RGBA copy of that is 160 MB, and a few exist at once while working).

## Privacy

Images are read, processed and saved inside the tab and never sent anywhere.
Only `mode`, `tolerance` and `smoothEdges` are stored, under
`yoshinya:background-remover:v1`; clicks, images and names are not. Analytics:
`files_added` and `download_completed` with counts, and `batch_action` with the
fixed actions `add_point`, `undo_point`, `clear_points`. The detected colour is
shown on screen but never sent.

## Tests

- `lib/remove.test.ts` — detection (white, other colours, JPEG-like noise, low
  coverage, transparent edges), connected vs global, the O's inside cleared by
  a click, a second colour cleared by a click, tolerance, walking through
  transparency, the source buffer left untouched, edge recovery (50% grey →
  half-transparent black), source alpha kept, and the pale-subject trap.
- `lib/settings.test.ts`, `lib/files.test.ts` — storage fallback and clamping,
  file acceptance, output names, duplicate numbering.
- `BackgroundRemoverTool.test.tsx` — defaults, rejected files with reasons,
  settings remembered and restored, reset, Japanese rendering.
- `e2e/smoke.spec.ts` — shared page structure; a real PNG whose outside is
  cleared and whose enclosed inside clears after a click on the canvas; no
  outside requests, and settings stored without the image.

## Out of scope

- AI subject cut-out (Week 47), which this page can gain as a second mode.
- Eraser and restore brushes.
- Replacing the background with another colour or image.
- Trimming the transparent margin — a likely next addition, since a logo
  usually wants it.
