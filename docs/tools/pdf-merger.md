# PDF Merger (よしにゃにPDF結合)

Week 8. Combines several PDFs into one, in an order the user controls, taking
either whole documents or only the pages they name. Everything runs in the
browser: `/ja/pdf-merger` and `/en/pdf-merger`.

## Problem being solved

Merging PDFs is one of the highest-volume chores on the web, and every free
service that does it uploads the files first. That is disqualifying in exactly
the places where the chore is most common — accounting, law, healthcare,
local government — where sending a contract or an invoice to someone else's
server is not allowed. The tool exists because "no upload" is not a feature
here; it is the only reason a whole class of user can use it at all.

Three concrete jobs it kills:

- Invoices and receipts that must go out as one file at month end.
- A scanner that saved every sheet as a separate PDF.
- A submission where only some pages of each form are wanted.

## Target users

Accounting and back-office staff, professional-services firms, students and
researchers assembling chaptered documents, and anyone who has hit a "2 files
per day" limit on a free merge site.

## Naming

- JA: よしにゃにPDF結合 — `複数ファイルを1つにまとめる - よしにゃにPDF結合｜無料・登録不要`
- EN: PDF Merger by Yoshinya — `Combine Files Into One - PDF Merger by Yoshinya | Free, No Sign-up`

The leading phrase avoids repeating "PDF" and "結合"/"Merge", which the tool
name already carries, and spends the space on a second keyword cluster instead.

## Features

- Up to 100 files, 100 MB each, 500 MB total. Files can be added in several
  drops; the limits count the running totals.
- Four ways to order the list: drag by the handle, per-card up/down buttons,
  *Name order*, and *Reverse*.
- Per-file page selection: `3`, `1-5`, `2,5,7`, `4-`, `-3`, and descending
  spans such as `5-2`. Empty means the whole document.
- The page count of the result is shown before the merge runs.
- The output file name is editable and becomes the merged document's Title.
- Errors and warnings are per file, and one bad file does not stop the rest.

## Implementation notes

### Ordering has four affordances, not one

Dragging alone is not enough. `@dnd-kit`'s pointer sensor needs an 8px
activation distance to coexist with the text field on each card, which makes
the drag feel deliberate on a mouse and fiddly on a phone; and a keyboard user
needs a control they can tab to. The up/down buttons are the fallback that makes
the feature reachable, and *Name order* is what people actually want after
dropping a folder of `scan-1.pdf … scan-12.pdf`.

Only the handle carries the drag listeners. Putting them on the whole card — as
File Renamer does, where a card is just a label — swallows the pointer before it
reaches the page-range input, and the field becomes impossible to focus.

### Name order has to be numeric

A plain string sort puts `10.pdf` before `2.pdf`, which is precisely wrong for
the scanner case that motivates the button. `Intl.Collator` with
`numeric: true` gives file-manager ordering and sorts numbered Japanese names
correctly at the same time.

### Page ranges keep what the user wrote

Two behaviours are deliberately *not* tidied up:

- **Duplicates are kept.** `1,1,2` really does insert page 1 twice. Repeating a
  cover or a divider page is a real use, and silently de-duplicating produces a
  document the user did not ask for.
- **Order is kept.** `3,1` puts page 3 first. Sorting the indices would be an
  invisible override of an explicit instruction.

A descending span (`5-2`) reverses, which falls out of the same principle.

Unreadable input is an error rather than a fallback to "all pages". Quietly
merging the wrong pages is the worst outcome available: it is not visible until
after the file has been sent.

The parser normalises full-width digits, commas and dashes first. A Japanese
keyboard produces `１−３` without the user noticing, and rejecting it for
looking wrong would just read as a broken tool.

Indices come out 0-based for pdf-lib while everything the user sees is 1-based;
the conversion happens once, inside the parser, and is pinned by tests.

### Signed and form-bearing PDFs warn, they do not block

PDF Title Editor blocks editing a signed PDF, because it re-saves the same
document and would void a signature the user wanted to keep. Merging is
different: the result is always a new document, so no source signature could
survive under any implementation. Blocking would be refusing to do the job over
a consequence that is inherent to the job. The card carries a warning instead,
and the guide and FAQ say it plainly.

Form fields go the same way. `copyPages` copies pages, not the AcroForm, so a
fillable form comes out flat. Saying nothing here would produce "the input boxes
disappeared" as a support question.

Detection differs between the two:

- **Signature** — byte scan for `/ByteRange`. A signature's ByteRange has to
  stay directly locatable in the file, so it cannot hide inside a compressed
  object stream. This is the same scan PDF Title Editor uses.
- **Form** — read `/AcroForm` off the catalog. The byte scan does *not* work
  here, and this was found by a failing test: pdf-lib writes object streams by
  default, so a form created by `doc.getForm().createTextField(...)` and saved
  leaves no `/AcroForm` string in the raw bytes at all.

### One `copyPages` call per source document

`copyPages` carries its own copy of whatever the pages reference. Calling it per
page, or per range clause, duplicates the fonts and colour spaces into the
output once per call — the merged file balloons for no reason. All the indices
for one document go through in a single call.

### Files are read one at a time

A hundred simultaneous `arrayBuffer()` calls is how mobile Safari kills the tab.
Each source is read, copied, and dropped before the next one starts, and a
`setTimeout(0)` between files lets the progress counter actually paint —
without it the whole merge runs inside one task and the UI jumps from 0 to done.

### The merged file gets a Title

`out.setTitle(...)` from the output file name. A merged PDF with no Title shows
as "untitled" in every viewer's tab, which is the exact problem Week 3 exists to
fix; leaving it for the user to correct in the other tool would be rude.

Author, Subject and Keywords are deliberately left empty. There is no correct
answer to "which source document's author wins", and carrying one over would
silently move a person's name into a file they did not write.

`updateMetadata: false` on every load, so pdf-lib does not stamp its own
Producer and ModDate onto documents we are only reading.

### Shared code, not copied code

Intake validation, the size and count limits, and download-name resolution were
already in PDF Title Editor and are identical here. They moved to `app/lib/pdf/`
(`filename.ts`, `types.ts`, `validate.ts`) and both tools import them. `formatBytes`
moved to `app/lib/format.ts` for the same reason. What stayed behind in PDF
Title Editor is what is specific to it: the Title↔filename mapping and the ZIP
naming a batch download needs.

The shared `PdfErrorCode` covers only the intake failures every PDF tool can
produce. Each tool widens it locally — PDF Title Editor adds `signed` and
`write_failed`, PDF Merger adds the two page-range codes and `merge_failed`.

### No preview, and what it would cost

Measured on 2026-09-09, then deferred.

Page thumbnails are not possible with what is already here: pdf-lib reads and
writes, it does not render. That needs pdf.js, and pdfjs-dist 6.3.289 costs
**494 KB gzipped** — 128 KB for the library plus 366 KB for the worker —
against pdf-lib's 201 KB. Lazy-loading moves when that arrives, not whether.
On top of the bytes it needs worker-URL resolution through Vite into Cloudflare
Workers, render memory for up to a hundred files, and render cancellation.

An iframe preview of the *merged result* needs no library at all, about twenty
lines, but iOS Safari and Android Chrome do not render PDFs inline in an
iframe, so on mobile it degrades to a fallback message. With the predicted page
count already shown in step ③, a mistake is visible before downloading anyway,
which is most of what a preview would have bought.

The point to revisit is Week 9's page organiser: extracting, deleting and
rotating pages cannot work without thumbnails, so pdf.js is required there.
Build it then as `app/lib/pdf/render.ts` and add thumbnails here on the back of
it, rather than paying 494 KB for this tool alone.

## Privacy

PDFs are read with `File.arrayBuffer()` and merged with pdf-lib in the browser.
Nothing is sent anywhere: there is no fetch in this feature, no worker beyond
the page, and no storage. Closing the page discards everything, and the source
files are only ever read.

Analytics stays inside `AnalyticsParams`: `files_added` and
`download_completed` carry the tool slug and a file count, plus `mode` set to
either `pages` or `all` to record whether page selection was used at all. Which
pages were chosen is user input and is never sent. Error messages are looked up
from a code, so a file name cannot reach one.

## Tests

- `lib/page-range.test.ts` — every accepted form, full-width input, the kept
  duplicates and order, 0-based output, and each rejection.
- `lib/order.test.ts` — numeric collation, Japanese names, and `moveItem`
  clamping at both ends without mutating its input.
- `lib/merge.test.ts` — integration against real pdf-lib. Each test page is
  given a unique width so the merged document can be read back and checked page
  by page, which covers list order, page selection, reversal, repeats, the
  Title, and that source metadata does not carry over.
- `PdfMergerTool.test.tsx` — the list, both reorder buttons and their disabled
  ends, both sort buttons, the predicted page count, the range explanation and
  its two error states, one bad range not stopping the others, a rejected
  non-PDF, the form warning not blocking, and the Japanese labels.
- `e2e/smoke.spec.ts` — the shared tool page structure loop covers the page.
