# Batch Image Compressor (よしにゃにまとめて画像圧縮)

## Problem being solved

Bulk compressors process a folder and give you no way to see what they did to
any individual picture. The tools that do let you look — Squoosh and its kind —
take one file at a time. Neither fits the actual job: reduce a batch, but check
the ones that matter.

This tool loads the whole batch, shows before and after on a slider, and lets a
quality settled on one image be applied to the rest. The motion is
*compare → decide → download & next*, not *configure → wait → hope*.

## Target users

- Web developers and front-end engineers
- Bloggers and publishers
- E-commerce staff preparing product photos
- Photographers and designers
- Anyone putting a lot of images on the web

## Naming

- Tool name: **Batch Image Compressor by Yoshinya**
- Japanese: **よしにゃにまとめて画像圧縮**
- URL slug: `image-compressor` (`/ja/image-compressor`, `/en/image-compressor`)

## Features

- **Add images**: drag & drop or file picker, JPEG / PNG / WebP. Anything else,
  and anything over the limits, is refused per file with a reason.
- **Compare**: before and after in the same place, revealed by a draggable
  divider. Zoom and pan apply to both sides identically, so a pixel under the
  line is the same pixel on both. Hold Space to see the original full-frame.
- **Settings**, applying either to every image or to the current one only:
  output format (keep original / JPEG / PNG / WebP), quality, resize with
  aspect-ratio lock and an upscale guard, and a background colour for
  transparency flattened into JPEG.
- **Apply to the rest**: the current quality, or the whole current setting set,
  copied onto the later images that are still unsaved. Announced with the value
  and the count, and undoable.
- **Sizes**: before, after, saved bytes and percentage per image and in total.
  Growth is reported as growth.
- **Full screen**: the comparison takes the whole screen with the settings
  panel floating over it, so format, quality, resize and apply-to-the-rest stay
  reachable. A bar along the bottom keeps the filename, the size change and
  *download & next*. Esc exits.
- **Download** one image, download and advance to the next unsaved image, or
  take everything as `yoshinya-compressed-images.zip`. Saved images stay in the
  list and can be re-adjusted and downloaded again.

## Changes made after the first working version

Everything here came out of review on a build that already passed its tests. The
sections below this one explain the substantial ones in full; this is the list.

**The comparison was lying about quality.** Three separate causes, found one at a
time: `will-change: transform` let the GPU scale a stale raster, softening the
detail the tool exists to show; `clip-path` on the transformed layer made the
seam drift away from the divider as soon as you zoomed; and clearing the output
on every settings change made the After side and the divider vanish and
reappear, which reads as the picture jumping. See *The comparison has to show
real pixels*, *The clip must live in stage coordinates*, and *The previous
result stays until the new one lands*.

**Quality 99 was the worst available trade.** Measuring rather than reasoning
showed it loses about as much as 80 while producing a far larger file, and that
100 alone switches WebP to lossless — smaller than 99 and pixel-identical. The
panel now says so at 90 and above. See *WebP quality is not what people expect*.

**Full screen was added.** Not in the specification; asked for during review. An
in-page overlay rather than the Fullscreen API, carrying the whole settings
panel rather than a lone quality slider. See *Full screen is an in-page overlay*.

**The resize fields started at 1.** Enabling resize now seeds them from the
image, which in turn required the paired dimension to follow while the ratio is
locked. See *Resize fields start from the image, not from nothing*.

**Two bugs in the same rule, opposite directions.** An override was dropped when
the image was edited to match the common settings, but not when the common
settings moved to match the image — so an image stayed badged as adjusted while
identical to the shared values. Both directions are now tested, because fixing
one alone produces the opposite bug.

**"Every image" did not mean every image.** Pinned images are skipped by design,
but the label promised otherwise. Renamed to *shared settings*, with the count
of skipped images shown and a one-click way to include them offered at the
moment the mismatch happens. See *Two right answers about pinning*.

**Labels that did not say what they meant.** *Never enlarge* became *never
enlarge beyond the original* — the original wording never said beyond what.

**Controls that did not line up.** The zoom row had the stepper spaced away from
its own number, an underlined link beside real buttons, and two different
heights. The height mismatch traced to `.ic-btn-small` being applied as a class
but never defined, so it silently did nothing. An e2e test now asserts the four
controls share one height.

**Content wider than its own frame.** This tool was 84rem while the header and
footer were 72rem, so on a wide screen the page overflowed the site frame. Fixed
by matching, then the whole frame was widened to 1280px in a separate commit.

**The panel was unreadable in full screen.** White text on a white block: the
palette had been overridden element by element, leaving a background token at
its light value. The panel now re-declares the palette, which fixed the warning
and error surfaces at the same time.

**Copy.** The lead became a question-question-answer, and deliberately avoids the
word *upload* — the privacy note two lines below says images are never uploaded.

**The English OGP had no brand.** `by Yoshinya` had been dropped so a long name
would fit. Shrinking the type is the right trade; dropping the brand is not.

## Where this departs from the specification

| Item | Specification | Built | Why |
| --- | --- | --- | --- |
| Web Worker | "if possible" (§13.2) | Yes | Decoding and painting a large photo stalls the main thread long enough to make a dragged slider stutter |
| PNG quality | name it unambiguously (§9.3) | No slider at all | Canvas ignores the quality argument for PNG. Renaming a control that cannot work does not make it work |
| ZIP compression | unspecified | STORE | Already-compressed formats; deflate costs seconds and saves almost nothing |
| Full screen | absent | Added | Raised in review; an extension of §6.2, "give the comparison preview priority for space" |
| Apply to all images | put it somewhere low-priority (§9.1) | Under **More**, with a confirmation | It changes images whose files are already saved to disk |

## Implementation notes

- **Encoding runs in a Web Worker** (`lib/encode.worker.ts`). Decoding a 30 MB
  photo and painting it to a canvas takes long enough that doing it on the main
  thread visibly stutters a dragged slider.
- **The worker resolves the output dimensions**, not the caller. The true pixel
  size is only known once the image is decoded, and on the first pass the caller
  does not have it — an earlier version encoded at natural size and needed an
  ugly second pass to apply the resize.
- **EXIF orientation** comes free from
  `createImageBitmap(file, { imageOrientation: 'from-image' })`; no EXIF parser
  is needed for the one EXIF field that matters here.
- **`EncodeQueue` caps concurrency and keys jobs by image.** Queueing a new job
  for an image drops the pending one, so a dragged slider cannot leave a stale
  encode to land after a newer one and overwrite it. Settings changes are also
  debounced.
- **PNG genuinely has no quality setting.** Canvas ignores the quality argument
  for PNG, so the slider is hidden and the UI says why, rather than offering a
  control that does nothing.
- **Object URLs are revoked** on removal, on replacement, and on unmount. Left
  alone they would hold the full pixel data of every image ever loaded.
- **ZIP entries are stored, not deflated.** These are compressed formats
  already; deflating costs seconds on a large batch to save almost nothing.

## Full screen is an in-page overlay, and carries the whole panel

Not the Fullscreen API. That hides the browser chrome and layers the OS's own
exit affordance and Esc handling on top of the app's, which is a different thing
from what this needs — and it does not exist for ordinary elements on iOS Safari
at all. Squoosh works the same way.

The first attempt put only a quality slider in the full-screen bar. That was
wrong: PNG output has no quality setting, so on the default *keep original
format* there was nothing to adjust and no way to change the format either. The
whole settings panel now floats over the picture instead.

Its palette is re-declared on the panel rather than each element being
restyled: the children are the same components the page uses, so they read
those tokens. Overriding them one at a time is how the PNG explanation ended up
as white text on a white block — it read as a broken empty container rather than
the sentence explaining why there is no quality slider.

It is rendered in one place or the other, never both — two copies would mean two
elements sharing every control id, breaking each label association on the page.

One cascade trap worth remembering: `.ic-viewer` and `.ic-fullscreen` have equal
specificity and land on the same element, so source order alone decides. Adding
`.ic-viewer { position: relative }` after the full-screen block silently
cancelled `position: fixed`, and the overlay stopped covering anything — the
page simply scrolled underneath it.

## Resize fields start from the image, not from nothing

Left empty, the first press of a number input's spinner jumps to 1 — a value
nobody wants and a strange place to begin adjusting from. Enabling resize now
seeds both fields with the image's real dimensions.

That made a second change necessary. With both dimensions set and the ratio
locked, `targetDimensions` fits the image inside that box, so a stale partner
value would quietly constrain a newly typed one. Editing either field now moves
the other while the ratio is locked.

## Two right answers about pinning, resolved at the moment of doubt

Setting something under *this image only* pins it, and the shared settings then
leave it alone. Two reasonable expectations collide here:

- a pin must survive, or careful work on one picture is lost the next time a
  shared value moves;
- *shared settings* should mean shared, or the word is a lie.

Neither can simply win. Making shared changes override pins destroys the
per-image feature the tool is built around; leaving pins silent makes the app
look broken — a user pinned one image to PNG, chose WebP under the shared
settings, and watched every other image change while that one did not.

So the choice is offered at the moment it arises. Changing a shared setting that
some images have pinned now says so and offers to include them:

> 個別調整した1枚には反映していません。［これも変更する］

Ignore it and the pin holds; take it and they line up. The release is scoped to
the fields that just changed, so an image pinned on both format and quality
keeps its quality pin when only its format is released.

Two coarser controls remain either side of it: *use the shared settings* clears
one image's pins, and *apply these settings to all N images* under **More**
clears everything, including downloaded images, behind a confirmation.

The state model never changed through any of this. What changed is that the
model is now visible, and reversible, exactly where someone would otherwise
conclude the tool was broken.

## Decisions worth remembering

**Partial overrides, not copies.** An image's settings are the common settings
with its own overrides layered on top, and a value that matches the common
setting is deleted rather than stored. So changing the shared quality still
moves an image that only overrode its format, and an image stops being marked
as adjusted the moment it no longer differs. Copying the whole settings object
per image would have made "apply to the rest" destructive.

**The rule is applied from both sides.** An override is dropped when its value
equals the common setting — so an image is marked *adjusted* exactly while it
genuinely differs. Editing an image applied that rule from the start; changing
the common settings did not, which left an image badged as adjusted after the
shared value caught up to it. Pruning there cannot change any effective value,
since it only removes keys that already equal the common one.

**The bulk-apply boundary.** Later, unsaved, not failed — and for a quality
apply, only formats where quality means anything. Reaching backwards would redo
images the user already settled; touching downloaded ones would make the file on
disk disagree with the app; including PNG output would report a count larger
than what actually changed.

**Undo stores settings, never blobs.** It restores what each image had —
including whether it had any override at all — and the outputs are regenerated.
Restoring an override that merely holds the same number would leave the image
marked as adjusted forever.

**The undo toast does not auto-dismiss.** Re-encoding the images a bulk apply
just changed can outlast any timer, and an undo that disappears while the user
is still checking the result is not an undo.

## WebP quality is not what people expect

Measured against a high-frequency test image, on Chrome's canvas encoder:

| Setting | Mean pixel error | Size |
| --- | --- | --- |
| PNG (lossless) | 0 | 177 KB |
| WebP quality 99 | **11.08** | 71 KB |
| **WebP quality 100** | **0** | **46 KB** |
| WebP quality 80 | 11.8 | 41 KB |

Two things follow, and neither is guessable from the UI.

**99 is not almost-lossless.** It loses about as much as 80 while producing a
far larger file — the quality curve is nearly flat above roughly 90.

**100 is a different codec.** At exactly 1.0 the encoder switches to lossless
VP8L: pixel-identical output, and here *smaller than quality 99*.

So the natural move — "I don't want to lose anything, so I'll use 99" — lands on
the worst trade available. The panel now says so at 90 and above and offers a
one-click jump to 100, and the guide and FAQ explain it.

This was found by a user noticing foliage detail disappearing at quality 99 and
asking whether that was normal. The numbers above came from measuring the
encoder, not from reasoning about it — the first three explanations that came to
mind were all wrong.

## The comparison has to show real pixels

`will-change: transform` on the comparison layers promotes them to composited
layers that the GPU scales from an existing raster, softening exactly the detail
the tool exists to reveal. It is removed deliberately: re-rasterising on zoom is
the point, and slightly less smooth panning is the right trade in a tool whose
whole purpose is accurate visual comparison.

Past 100% the images render with `image-rendering: pixelated`, so what is on
screen is the actual pixels rather than the browser's interpolation of them.

## The clip must live in stage coordinates

`clip-path` resolves in the clipped element's own coordinate space. Applying it
to the transformed layer meant the seam scaled and panned with the image while
the divider stayed at its percentage of the stage — the two drifted apart as
soon as you zoomed, and the after side appeared shifted.

The clip now sits on an untransformed wrapper that tracks the stage exactly,
with only the layer inside it transformed. An e2e test asserts the wrapper's
computed transform is `none` and that its box matches the stage.

## The previous result stays until the new one lands

Clearing the encoded output the instant a setting changed made the entire After
side *and the divider* disappear for the length of a re-encode. At 1:1 that is a
brief flicker; zoomed in, with the image not filling the stage, it reads as the
picture jumping.

The output is now retained and swapped in place, and downloads are gated on
`processingState` rather than on a blob merely existing — that gate is what makes
holding a stale result safe. The superseded object URL is revoked once its
replacement is committed.

## A bug worth recording

On a phone the page rendered **701 CSS pixels wide on a 412 pixel device**, so
the browser zoomed out and every control shrank. The horizontal thumbnail strip
had no `min-width: 0`, so its min-content width — three 14rem cards — set the
width of its grid column and then of the page.

It surfaced as an e2e failure that looked nothing like its cause: a click on the
undo button reported as intercepted by the comparison stage. Several plausible
explanations for that were wrong; measuring `window.innerWidth` was what
actually found it. `e2e/smoke.spec.ts` now asserts `scrollWidth <= clientWidth`
so it cannot come back.

## Privacy

Images are decoded, re-encoded and zipped entirely in the browser. Nothing is
uploaded, no account is needed, and reloading discards everything. Analytics
events carry counts and tool identifiers only — never a filename, never image
data.

Re-encoding drops EXIF metadata such as capture location, which is usually
wanted before publishing. The UI says so rather than leaving it to be
discovered.

## Reuse

`lib/` is deliberately free of UI. A future WebP converter or resize page would
differ only in its default settings and its copy, per the spec's intent — though
neither is published yet.

## Tests

- `lib/settings.test.ts` — override merging, format resolution, quality bounds
- `lib/navigation.test.ts` — next-unsaved selection and the bulk-apply boundary
- `lib/resize.test.ts` — dimension maths, ratio lock, upscale guard, distortion
- `lib/filename.test.ts` — extension swapping and duplicate numbering
- `lib/format.test.ts` — reduction rates, including honest growth
- `lib/validate.test.ts` — format and limit rejection, per file
- `lib/reducer.test.ts` — bulk apply and undo against every boundary the spec
  names
- `e2e/smoke.spec.ts` — comparison appears, bulk quality touches only later
  unsaved images, undo restores them, download-and-next advances, format changes
  the extension, ZIP, rejection, and the page-width guard
