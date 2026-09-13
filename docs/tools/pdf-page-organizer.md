# PDF Page Organizer (よしにゃにPDFページ整理)

Week 9. Opens one PDF as a grid of page thumbnails and lets the pages be
reordered, rotated, deleted, kept, or cut into several files. Everything runs in
the browser: `/ja/pdf-page-organizer` and `/en/pdf-page-organizer`.

## Problem being solved

Three of the highest-volume PDF chores on the web — splitting, deleting pages,
rotating pages — are the same job seen from different angles, and every free
service that does them uploads the document first. That is disqualifying in the
places where the chore is most common: accounting, professional services,
healthcare, local government. As with PDF Merger, "no upload" is not a feature
here; it is the only reason a whole class of user can use the tool at all.

Concrete jobs it kills:

- A scan where some pages came out sideways or upside down.
- Blank sheets and duplicates in a document that has to go out.
- Sending only part of a form, with the rest not shared.
- One PDF holding forty invoices that have to become forty files.

## Target users

Accounting and back-office staff, professional-services firms, anyone with a
scanner, and students and researchers pulling chapters apart. Also everyone who
has hit a "2 splits per day" limit on a free site.

## Naming

- JA: よしにゃにPDFページ整理 — `分割・抽出・回転を一括 - よしにゃにPDFページ整理｜無料・登録不要`
- EN: PDF Page Organizer by Yoshinya — `Split, Extract, Delete and Rotate - PDF Page Organizer by Yoshinya | Free, No Sign-up`

The leading phrase avoids repeating PDF / ページ / 整理, which the tool name
already carries, and spends the space on the three separate keyword clusters
this one tool ranks for. The Japanese title measures 32 full-width units, so
only `無料・登録不要` is at risk of being cut in a SERP.

## Features

- One PDF at a time, up to 100 MB and 1,000 pages.
- A thumbnail per page, drawn as it scrolls into view.
- Select by click, shift-click for a run, select all, invert.
- Rotate left/right (the selection, or every page when nothing is selected),
  delete, keep-only, reverse, drag to reorder, per-card move and rotate.
- Undo and redo across the last fifty changes.
- Save as one PDF, or split into several and download them as a zip. Three ways
  to cut: markers the user places, every N pages, or at the selected pages.
- Both the resulting page count and — for a split — the file count and page
  ranges are shown before anything is downloaded.

## Decisions

### One file at a time, and what that costs

Every other batch tool here takes a hundred files. This one takes one, because
the page grid *is* the working surface: a second document would need either
tabs or a visible file boundary drawn through the grid, and thumbnails for two
long documents at once is exactly the memory profile that kills a tab on mobile
Safari.

That collides with the product rule that every tool works in bulk, so the rule
is met one level down: bulk here is **pages**, not files. Fifty pages rotate in
one press, and a split writes forty files in one run — against a free
competitor that rotates one page per click. The case for merging several files
is already covered by PDF Merger, which leaves a clean division: **merger puts
files together, organizer fixes the inside of one file.** Both guides say so,
and the merger's FAQ now points here by name.

Revisit if "reorder pages across several PDFs" turns up in real requests. Even
then the answer is probably page reordering inside the merger, not multi-file
support here.

### pdf.js, and paying its 494 KB once

`app/lib/pdf/render.ts` is the shared renderer the merger's write-up promised
when it deferred preview in Week 8. It is loaded by dynamic import on the first
drop, so the tool page itself still ships nothing of it: the built client has
pdfjs (129 KB gzipped) and pdf-lib (178 KB gzipped) in chunks listed only in
the lazy dependency map. Adding thumbnails to PDF Merger on the back of this is
now a small change; it has not been done yet.

Thumbnails are drawn at 220 px times the device pixel ratio, capped at 2x —
a little wider than the widest column the grid produces, so a card scales the
raster down rather than up — and only for pages an `IntersectionObserver` reports as
near the viewport. At most 120 are held; past that the oldest off-screen ones
are dropped and redrawn if the user scrolls back. Two renders run at a time,
and scrolling a page out of view aborts its render through an `AbortSignal`.

### The trap: pdf.js detaches the buffer it is given

pdf.js transfers the `ArrayBuffer` passed to `getDocument` to its worker, which
detaches it on this side. The writing half of the tool holds the same bytes for
pdf-lib, so sharing one buffer leaves the save step reading an empty array —
and only at the moment the user clicks download. `createRenderer` therefore
copies with `bytes.slice(0)` before handing anything to pdf.js, and
`render.test.ts` pins that the caller's buffer survives.

A second, smaller trap turned up while testing the abort path: an abort that
lands while `getPage` is still resolving has already fired its event, so a
listener attached afterwards never hears it and the render runs on with nobody
waiting. The renderer re-checks `signal.aborted` after attaching.

### Rotation is absolute, and added to what the page had

`setRotation` replaces the angle rather than adding to it, so "set 90" on a page
already at 90 looks like it did nothing — the everyday case, since a sideways
scan is a page with `/Rotate 90` on it. Each page therefore carries both the
rotation it arrived with and the absolute angle to write, and the UI turns the
thumbnail by the difference (pdf.js has already applied the original). Angles
are normalised to 0/90/180/270: pdf-lib refuses anything else, and a PDF in the
wild can carry an angle that is not a multiple of 90.

### Undo, in the MVP rather than later

Deleting thirty pages in one press is the point of the tool and also the
mistake nobody can undo by hand. What is kept in history is the page list — a
small array of ids and angles, never the thumbnails — so fifty steps cost
almost nothing.

### Same-origin font and image data

pdf.js needs three sets of data files to draw certain pages: predefined CMaps
for CJK text in a font the document does not embed (routine in Japanese
business PDFs), the 14 standard fonts, and WebAssembly image decoders. Left
unconfigured it skips them, and the thumbnail comes out missing its text. The
usual fix is to point it at a CDN, which would tell someone else's server which
documents a visitor opened — so `scripts/copy-pdfjs-assets.mjs` copies them out
of `pdfjs-dist` into `public/pdfjs/` before dev and build, gitignored, and
`getDocument` is pointed there. An e2e test asserts that opening a PDF makes no
request to any other host.

### No preview beyond the thumbnail, no page insertion

Clicking a thumbnail selects; there is no enlarged view, which would need its
own overlay and a second render size. Inserting pages (a blank sheet, or pages
from another file) is out: it is a different mental model — this tool subtracts
and rearranges — and the merger covers the case where pages come from
elsewhere.

### Bookmarks are dropped, deliberately

pdf-lib has no outline API, and an outline that survived would point at page
numbers that no longer mean anything after a reorder or a delete. Both guides
say so rather than leaving it to be discovered.

## Structure

```
app/features/pdf-page-organizer/
  PdfPageOrganizerTool.tsx   state, history, the thumbnail queue, save
  components/Dropzone.tsx    one file in
  components/PageCard.tsx    one page: thumbnail, selection, per-page actions
  lib/pages.ts               reorder, rotate, delete, keep-only, reverse
  lib/split.ts               cuts → segments, and how they read on screen
  lib/history.ts             undo/redo over the page list
  lib/filename.ts            report-01.pdf … report-12.pdf, report-split.zip
  lib/organize.ts            pdf-lib: inspect, and write the outputs
  lib/types.ts               page item, error codes, limits
app/lib/pdf/render.ts        pdf.js thumbnails (shared)
app/lib/pdf/inspect.ts       signature / form disclosure, shared failure codes
app/lib/pdf/zip.ts           createPdfZip, moved out of pdf-title-editor
```

Moving `createPdfZip` and the two disclosure checks into `app/lib/pdf/` rather
than copying them follows the rule set when `validate.ts` and `filename.ts`
moved there in Week 8: a duplicated check is a check that gets fixed in one
place only. PDF Title Editor and PDF Merger were both repointed, and their
tests still pass.

## Privacy

The PDF is read with `File.arrayBuffer()`, drawn by pdf.js in a worker served
from this origin, and rewritten by pdf-lib in the page. Nothing is sent
anywhere: there is no fetch in this feature, no CDN, and no storage. Closing the
page discards everything, and the source file is only ever read.

Analytics stays inside `AnalyticsParams`: `files_added` and
`download_completed` carry the tool slug and a page count, plus `mode` set to
`single` or `split`; `batch_action` carries `rotate`, `delete`, `keep-only` or
`reorder` with the number of pages touched. No file name, no page contents, no
typed output name. (The spec proposed bucketing the page count into ranges;
what shipped sends the count itself, which is what every other tool does and
what the parameter type is for.)

## Tests

- `lib/pages.test.ts`, `lib/split.test.ts`, `lib/history.test.ts`,
  `lib/filename.test.ts` — the pure logic, including the rotation cases that
  the absolute-angle decision exists for.
- `lib/organize.test.ts` — against real pdf-lib: deletions, order, rotation
  written as `/Rotate`, split boundaries, titles, progress.
- `app/lib/pdf/render.test.ts` — the renderer's contract with pdf.js mocked:
  the buffer copy, worker source, cancellation, and refusal after destroy.
- `PdfPageOrganizerTool.test.tsx` — the grid and the buttons, with the renderer
  stubbed because jsdom has no canvas.
- `e2e/smoke.spec.ts` — the only place pdf.js actually draws: thumbnails
  appear, a page is deleted and downloaded, a split downloads a zip, and no
  request leaves this origin.
