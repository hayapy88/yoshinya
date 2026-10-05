# QR Code Generator (よしにゃにQRコード作成)

Week 12. Makes QR codes that hold the destination itself, for a URL, WiFi
credentials, a contact card or an email — one at a time, or a whole pasted list
at once as a ZIP. Everything runs in the browser: `/ja/qr-code-generator` and
`/en/qr-code-generator`.

## Problem being solved

QR generators are not scarce, and "can you make one" is not the problem. What
goes wrong happens after the code is printed:

- **The link dies.** Most free generators encode their own short URL and
  redirect to yours. When the service closes, changes plans, or expires a free
  link, every printed copy stops working at once.
- **Someone else counts the scans.** The same redirect that allows editing also
  routes every scan through a third party.
- **One at a time.** Forty products or thirty seats means forty or thirty trips
  through the same form.

Writing the address directly into the image removes the first two by
construction, and the bulk box removes the third. The cost is stated plainly in
the guide: a code made this way cannot be repointed after printing, because the
destination *is* the code.

## Why not just use a library end to end

`qrcode-generator` (zero dependencies) does the encoding; the drawing is ours,
because both outputs need something its built-in renderers do not offer — an
exact pixel size for the PNG, and a single path for the SVG. Both reasons are
below.

## UTF-8 is handed to the library, not configured in it

The library's own byte encoder keeps the low byte of each character, so
Japanese would encode as mojibake that scans perfectly and shows the wrong
text. It ships a UTF-8 encoder, but only on the global build: the ES module
exports no `stringToBytesFuncs`, so the documented swap is unavailable here.

Since the default encoder masks with `& 0xff`, the fix is to hand it a string
whose characters already *are* the UTF-8 bytes (`toByteString`). No global is
mutated, and `TextEncoder` does the encoding that matters.

`lib/qr.test.ts` pins this with a module count: `'こんにちは'` is 15 bytes in
UTF-8 and needs version 2 (25 modules), where the library default would fit
version 1 (21). A number is the cheapest proof the right bytes went in.

## PNG exports are rounded down to whole modules

`exportSize` divides the requested pixel size by the number of modules across
(including the quiet zone), floors it, and multiplies back. A 512px request on
a 33-module code exports at 495px.

Fractional scaling spreads the rounding unevenly — some modules a pixel wider
than their neighbours — and the error shows up as scan failures when the code is
printed small. The exported size is shown next to the buttons rather than
silently differing from the number in the field.

## The SVG is one path, not hundreds of rects

Dark modules are merged into horizontal runs and emitted as a single `<path>`.
A grid of adjacent `<rect>` elements renders with hairline seams between
neighbours in several print and PDF pipelines, and those white lines are read as
damage. One filled path has no seams.

## Escaping is the part that fails silently

A malformed WiFi or vCard record still produces a valid-looking QR code that
scans and then does the wrong thing, so `lib/payload.ts` is the most heavily
tested file here.

- WiFi: `\ ; , : "` are escaped. An SSID containing `;` otherwise ends the
  field early and the rest is read as another setting.
- vCard: `\ ; ,` and newlines are escaped — except inside `URL:`, whose commas
  and semicolons are part of the address and are handed to the browser as
  typed.
- `H:true` is written only for a network actually marked hidden. Writing it
  always makes some phones hunt for a hidden network and fail to join.
- An open network omits `P:` entirely rather than sending an empty one, which
  makes some scanners prompt for a password.
- A URL typed without a scheme gets `https://`, because a code holding
  `yoshinya.com` is read as plain text by most scanners.

## Bulk is capped, named and deduplicated

One code per line, up to 200. `name,value` splits on the **first** comma only,
so a URL carrying commas survives; `#` lines are skipped so a pasted spreadsheet
header can stay. File names are stripped of what a file system refuses, and a
repeated name gets a counter — two identical names inside a ZIP means one file
silently replaces the other. A row too long to encode is skipped by name rather
than failing the other 199.

## Settings are remembered; input never is

`localStorage` holds the mode, error-correction level, PNG size and quiet zone.
It never holds what was typed. This is the tool where someone enters the guest
WiFi password or an unannounced product URL, and leaving either on a shared
computer costs more than retyping it. The e2e suite asserts both halves: the
settings come back after a reload, the URL does not.

## Colours are measured, not trusted

Both colours are free to change, and both are checked rather than accepted. A
scanner finds the code by the difference between dark modules and a light
field, so `assessColors` reports the WCAG contrast ratio and warns below 4:1 —
which is where a mid-weight brand colour on white usually lands. The brand's
own coral is 2.8:1 on white, and the test suite pins that number precisely
because it is the choice a palette invites.

An inverted code — the modules lighter than the field — is flagged separately.
Its contrast can be perfect while a scanner still refuses it, so folding the
two warnings into one would describe the wrong problem.

Colours reach the markup only through `safeColor`, which is `normalizeHex` plus
a fallback. That function moved from `icon-generator/lib` to `app/lib/color.ts`
when this tool needed it, rather than being copied: it is the only thing
standing between a typed value and a `fill="…"` attribute.

## The middle holds a logo, a word, or nothing

The modules under a logo or a word are not reserved — they are overwritten,
and the scanner rebuilds them from the error-correction data. Everything about
the feature follows from that:

- Choosing either switches the error-correction level to H, and says so.
- The size stops at a quarter of the code's width, about 6% of its area, well
  inside what H can rebuild. The rest of the redundancy is left for the creases
  and thumbprints a printed code actually picks up.
- A panel in the background colour is painted a module wider than the logo on
  each side. Without it, a logo with transparent edges leaves fragments of
  module showing, and a fragment is read as data rather than as damage.
- Only `image/png`, `image/jpeg` and `image/webp` are accepted, at up to 2MB.
  SVG is refused: the file is embedded in markup that is handed to an `<img>`
  and to a download, and an SVG can carry a script into both.
- The image is embedded as a data URL, so the canvas is never tainted and the
  saved SVG does not reference a file that no longer exists.

What the tool does not do at runtime is verify that the finished code still
decodes. That would need a reader library and a verification pass worth
trusting; the guide and the UI say instead to scan the result with a phone
before printing a thousand of them. The caps above are what makes that advice
reasonable rather than a disclaimer.

The logo is never stored. Settings are remembered, including its size, but the
image itself is usually someone's brand asset and belongs to the session.

### A word instead of a logo

The centre is a three-way choice — nothing, a logo, or text — because a brand
with no mark still has a name. The text carries its own colour, defaulting to
the code's: `textColor` is stored as `string | null`, and null means "follow
the code colour" rather than a copy that silently goes stale when the code
colour changes.

A word is a wide, short band rather than a square, so it gets its own limits:
the font size is a share of the code's width (4–12%), and the band may not
exceed 55% of it. When a word would overrun the band the font shrinks rather
than the band growing, because a stripe across a code is no longer a code.

That 55% is measured, and the measurement came from a bug. The cap was
originally 60% and was applied to the glyphs, with the panel's two modules of
padding added afterwards — so a band meant to stop at 60% actually covered 64%.
The first example image published for the FAQ was an eight-letter Latin word at
the maximum size, and it did not decode. Sweeping band widths against a decoder
on a 29-module code at level H puts the failure between 60% and 64%, so the cap
now applies to the finished panel and sits at 55%, inside the point where it
breaks. A printed code also meets creases and glare that a test image never
does.

`estimateEmWidth` sizes the text without measuring it: full-width characters
count as one em, Latin letters as roughly half. A canvas could measure exactly
when drawing the PNG, but there is no canvas when building the SVG, and the two
outputs have to agree about where the backing panel ends. One estimate used by
both keeps them identical.

The SVG keeps the word as a real `<text>` element, so it renders in whatever
font opens the file — stated in the guide rather than worked around, since
someone saving an SVG usually wants text they can still edit. The PNG bakes in
what the screen showed. `escapeXml` is what stops a typed `<` from closing the
element early.

## The worked examples in the FAQ

The FAQ opens with the home page rendered as a code twice — once with the logo
in the middle, once with a word — because "what does one actually look like"
is the question a visitor asks before any of the others. The images live in
`public/examples/qr-code-yoshinya-{logo,text}-{ja,en}.png`, one pair per locale,
so the Japanese page's example opens the Japanese home page.

`FaqEntry` gained an optional `images` array for this, which any tool's guide
can now use. The pictures are deliberately left out of the FAQ structured data:
schema.org answers are text, and a test pins that the JSON-LD never mentions
`/examples/`.

Every example is a genuine export from this tool, and each one is decoded
before it ships — the English text example was regenerated after the cap fix
above, since the original was built under the looser limit.

## Trademark

"QR Code" is a registered trademark of DENSO WAVE INCORPORATED. The guide says
so, in both locales, and the FAQ explains what it does and does not restrict —
the trademark covers the name, not the use of generated codes.

## Tests

- `lib/payload.test.ts` — every mode, the WiFi and vCard escapes, scheme
  completion, hidden networks, open networks, the fields left out when blank.
- `lib/qr.test.ts` — UTF-8 via module count, error-correction levels, square
  matrix, finder pattern, `QrCapacityError`, whole-module export sizes, the
  merged SVG runs, the quiet zone, canvas draw order.
- `lib/bulk.test.ts` — blank and `#` lines, first-comma split, unsafe
  characters, duplicate names, the 200 limit, CRLF and CR input.
- `lib/settings.test.ts` — defaults, round-trip, hand-edited values, clamping,
  a colour that is not a colour, a logo ratio beyond the cap.
- `lib/colors.test.ts` — black on white, brand navy, brand coral (warned), an
  inverted pair, and the fallback for an unparseable value.
- `lib/logo.test.ts` — centring, the backing panel, the size cap at both ends,
  and the file types and size that are refused.
- `lib/text.test.ts` — the width estimate for Japanese, Latin and emoji, the
  font shrinking to stay inside the band, the panel cap including its padding,
  centring, and XML escaping.
- `app/lib/color.test.ts` — the contrast ratio and relative luminance that both
  of those rest on.
- `QrCodeGeneratorTool.test.tsx` — drawing as you type, mode switching, the
  open-network field hiding, over-long input, the bulk count, settings
  persistence without input persistence, the contrast and inversion warnings,
  the logo embed with its forced level change, a word drawn in the code's
  colour and then in its own, the font shrinking on a long word, the Japanese
  page.
- `e2e/smoke.spec.ts` — the Japanese flows end to end, PNG and ZIP downloads,
  the contrast warning, a real logo upload, no outbound request, settings
  stored but not the input; plus two decode round-trips — one through a
  coloured code carrying a logo, one through a code with a word across the
  middle — and the shared page structure block.
