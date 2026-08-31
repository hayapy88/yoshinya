# Icon Generator (よしにゃにアイコン作成)

## Problem being solved

Putting a row of icons into a deck, a document or an admin screen involves a
surprising amount of manual work: find each icon on a stock site, download it
one at a time, open the SVG in an editor to change `stroke` to the brand
colour, notice that the line weight does not match the rest, and then do it all
again when someone asks for PNGs at three sizes.

The tool takes the part that is actually repetitive — applying one appearance
to a set of icons and exporting them all — and does it once.

## Why this is not an icon library

The obvious version of this tool is a stock icon site with a search box. That
version cannot win. Sites like ICOOON MONO and SVG Repo carry tens of thousands
of icons; a curated 128 is not a competitor. Worse, an asset library does not
use the one thing Yoshinya has — a stock site has no user files, so "nothing is
uploaded" means nothing to anyone.

The chore is on the other side of the download. Bulk restyling and multi-size
export is what no free stock site offers, it is a genuine "まとめてやる" case,
and it targets compound queries (`svg アイコン 色 変更`, `アイコン まとめて
ダウンロード`) rather than the head term `アイコン 素材 無料`, which is not
winnable.

## Naming

| | |
| --- | --- |
| Japanese | よしにゃにアイコン作成 |
| English | Icon Generator by Yoshinya |
| Slug | `icon-generator` |

## The icons come from Lucide, and that has obligations

The 128 icons are [Lucide](https://lucide.dev) (ISC), some of which derive from
Feather (MIT, Cole Bemis). Drawing them by hand would have consumed the
entire build; adopting a permissive set was the only way this fits in a day.

What the licences require of us, and what the repository does about it:

- `app/features/icon-generator/icons/LICENSE` is `node_modules/lucide-static/LICENSE`
  copied **verbatim**. It already carries both the ISC and the MIT notices, and
  several of the chosen icons are on the Feather-derived list, so both are needed.
  Rewriting it in our own words would be the one way to get this wrong.
- The tool page credits Lucide with a link, in both locales, in the export
  section and again in the guide.
- No copy anywhere claims the icons are original to Yoshinya.

Nothing is required of the user. What they download is commercial-use,
modifiable, and needs no attribution — which is worth saying on the page,
because it is the first thing anyone looking for icon assets checks.

## Icon data is generated at build time, not imported

`scripts/build-icons.mjs` (`npm run build:icons`) reads the chosen icons out of
`lucide-static` and writes `app/features/icon-generator/lib/icon-data.ts`, which
is committed.

`lucide-static` stays a devDependency. Importing it at runtime would either pull
2000+ icons into the client bundle to use 128, or read the filesystem during
SSR, which the Worker cannot do. Generating once also keeps the output reviewable in
a diff.

The script strips the `<svg>` wrapper and keeps only the drawing elements. It
then asserts that what remains is nothing but self-closing `path`, `circle`,
`rect`, `line`, `polyline`, `polygon` and `ellipse` elements, and throws
otherwise — that markup is rendered with `dangerouslySetInnerHTML`, so the
guarantee has to be made where the data is produced rather than where it is
used.

`tags.json` is keyed by Lucide's preferred name, which is not always the file
name. `circle-help` is filed under `circle-question-mark`, and without the alias
map in the script it would ship with no English search terms at all.

## One builder, used for the preview, the grid, the clipboard and the PNG

`buildSvg(icon, style)` is the only thing that produces markup. The big preview,
all 128 grid tiles, the copied code, the downloaded `.svg` and the source of
every PNG are the same function with a different `size`. There is no separate
render path that could disagree with the export — what is on screen is the file.

Two decisions inside it:

- **Output is indented, not minified.** Its main destination is the clipboard
  and from there someone's source file.
- **Numbers are rounded to three places.** `32 * 0.22` is `7.040000000000001`,
  and shipping that inside markup a person is about to paste into their own
  codebase looks careless.

## Stroke width scales with the icon, deliberately

`stroke-width` is a coordinate inside the `viewBox`, not a pixel value, so
enlarging an icon thickens its line proportionally. This is what "make it
bigger" is expected to mean, and it is what keeps a set drawn at 32 and at 512
looking like one set.

The alternative — holding the stroke at a constant pixel weight — would quietly
turn a large icon into a different, thinner design. It is stated next to the
control rather than only in the guide, because it is the one behaviour people
expect to work the other way round.

## Padding only exists behind a background

`padding` is stored at all times but only reaches the output when
`background !== 'none'`. Padding around a transparent icon is invisible margin
that every downstream layout still has to deal with, so the builder drops both
the offset and the `transform` attribute in that case.

With a background, the canvas grows to `24 + 2 × padding` on both axes and the
icon is translated into the middle of it.

## Colour is normalized before it reaches any markup

`normalizeHex` is the only route from an input field to a `stroke="…"`
attribute. It expands `#abc`, tolerates a missing `#` and surrounding
whitespace, and returns `null` for anything else — including a value carrying a
quote character, which would otherwise break out of the attribute it is written
into. The generated SVG goes to the clipboard, to a download and into an
`<img>` for rasterising: three places where malformed markup fails three
different ways.

The hex field keeps its own draft and only commits a value that parses, so
typing `#1` on the way to `#162e64` does not blank the colour.

## PNG rasterising

`svgToPngBlob` loads the SVG through a **blob** URL rather than a data URL: a
data URL has to be percent-encoded, and getting that wrong for a document full
of quotes and `#` colours fails silently as a blank image.

The canvas is never tainted, because the generated SVG references nothing
outside itself — no fonts, no remote images, no stylesheets. That is what makes
`toBlob` legal, and another reason the icon markup is a build artifact rather
than anything a user can supply. The canvas is left unpainted, so an icon with
no background exports with a transparent one.

## Export layout

- SVG file names carry no size (`house.svg`) — one vector file covers every
  size, and a number would imply otherwise.
- PNG file names do (`house-128.png`) — several resolutions of one icon end up
  in the same folder.
- The ZIP separates them: `svg/house.svg`, `png/128/house-128.png`. Two formats
  at three sizes across twenty icons is otherwise 80 files in one heap.
- `plannedFileCount` derives the number on the button the same way the ZIP is
  filled, rather than estimating it separately.

`Select all` selects what is currently on screen rather than all 128: after a
search, taking the whole set would be a surprise.

## Settings are remembered, selections are not

Colour, stroke, size, background and export format go to `localStorage` under
`yoshinya:icon-generator:v1`. Which icons were ticked does not — a selection
from last week is not something anyone wants back.

`parseSettings` is written defensively because that store outlives deploys and
is editable by hand. Out-of-range numbers are clamped, unknown background
shapes and unparseable colours fall back to the default, PNG sizes the tool no
longer offers are dropped, and an empty size list is refilled — PNG ticked with
no sizes would promise files the export cannot write.

## Privacy

The tool never reads a user file. The only things entered are a colour and a
search word, and neither leaves the browser; generation, PNG conversion and ZIP
packing all happen locally.

Analytics carry counts and fixed values only: `tool_opened`, `batch_action`
with `copy_svg` / `download_svg` / `download_png`, and `download_completed` with
the number of files in the ZIP. Which icons were chosen is not sent — an icon id
is a fixed value, but the set someone picked says more about what they are
working on than we need to know.

## Tests

Unit (`app/features/icon-generator/lib/*.test.ts`):

- `svg` — viewBox and size attributes, colour and stroke on the group, the
  absence of a background and `transform` when the background is off, canvas
  growth with padding, circle and rounded-rect backgrounds, float rounding, and
  that the output is indented.
- `color` — three-digit expansion, missing `#`, whitespace, rejection of
  non-colours and of a value that would escape an attribute.
- `search` — localized name and keyword matches, English id and tag matches,
  case-insensitivity, multiple terms as AND, the ideographic space as a
  separator, category filtering, and a missing label.
- `files` — naming, ZIP paths, and the file count across format combinations.
- `settings` — round trip, clamping, unknown shapes, bad colours, unusable PNG
  sizes.

Component (`IconGeneratorTool.test.tsx`): the full grid renders, search narrows
and restores it, a keyword finds an icon its name does not contain, the empty
state offers a way out, a colour change reaches every tile and the preview, a
half-typed colour does not wipe the current one, the file count follows the
selection and the PNG sizes, the export is blocked without a format, settings
survive a remount, nonsense in storage is ignored, and the credit links to
Lucide.

E2E (`e2e/smoke.spec.ts`, `icon generator workflow`): recolouring the whole
page, copying SVG with the chosen settings, a single PNG download at the chosen
size, a ZIP of both formats, and settings surviving a reload.

The e2e block routes every test through an `openTool` helper that proves the
grid responds before the test starts. The page is server-rendered, so an
interaction that lands before React hydrates is dropped silently — the input
keeps the value and no state changes. That race failed roughly one run in five
on the mobile project before the helper was added.
