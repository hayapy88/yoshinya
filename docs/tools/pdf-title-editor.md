# PDF Title Editor (よしにゃにPDFタイトル変更)

## Problem being solved

Renaming a PDF does not change the title stored inside it. Browsers show that
internal title in the tab, PDF readers show it in the window and in the document
properties dialog, and it is often left over from whatever template, slide deck,
or Word file the PDF was exported from. Fixing it normally means opening a paid
PDF editor and clicking through a properties dialog per file. This tool exposes
the metadata directly, edits it in the browser, and does the whole batch at once.

## Target users

- Web managers, marketers, and communications teams publishing PDFs
- Employees and freelancers working with quotes, invoices, proposals, reports
- Teachers and trainers distributing PDF learning material
- Administrators tidying PDFs received from customers
- Anyone whose renamed PDF still shows an old title in the browser tab

## Naming

- Tool name: **PDF Title Editor by Yoshinya**
- Japanese: **よしにゃにPDFタイトル変更**
- URL slug: `pdf-title-editor` (`/ja/pdf-title-editor`, `/en/pdf-title-editor`)

## Features

- **Add PDFs**: drag & drop or file picker, several at once. Non-PDFs, empty
  files, and files over the limits are refused with the reason shown per file.
- **Per-file editing**: the current internal title is displayed next to the
  filename, with the new title and the download filename as the primary fields.
  Author, subject, and keywords sit behind an *Other metadata* disclosure.
- **Change markers**: a coral orange dot appears beside the label of every field
  whose value now differs from what was read out of the PDF, and beside the
  *Other metadata* summary when a change is hidden inside it. The card's own
  *Modified* badge is derived from the same data, so the header can never claim
  a change the fields do not show.
- **Batch actions** (shown once more than one PDF is loaded):
  - *Use filename as title* / *Use title as filename*
  - Apply one value to title, author, subject, or keywords, either to **all
    files** or to **blank fields only** — the button states how many files the
    action would touch before it runs.
  - Reset all changes; remove all (with confirmation)
- **Creating**: with one PDF loaded there is a single button at the bottom of
  the page. With several, each card gains a *Create this one* button for
  releasing a finished file early, and the bottom button becomes *Create all and
  download ZIP*.
- **Output**: one PDF downloads directly, several download as
  `yoshinya-pdf-title-editor-YYYYMMDD-HHmm.zip`. Duplicate output names get
  `name (2).pdf` suffixes. If some files fail, the successful ones still
  download.
- **Blocked cases**: password-protected and corrupted PDFs are rejected;
  digitally signed PDFs load but editing is disabled, because re-saving would
  rewrite the byte offsets the signature covers.
- **Guide** below the tool: what a PDF title is, how it differs from a filename,
  how to use the tool, when it helps, privacy, FAQ, and related tools. It sits
  under one *Guide* heading (`h2`) with the sections one level below it (`h3`),
  so the page outline is `h1 → h2 → h3` with no skipped levels. The FAQ entries
  are the same objects the `FAQPage` structured data is built from, so the two
  cannot drift apart.

## Implementation notes

- `lib/pdf.ts` is the only module that touches `pdf-lib`, and it imports it
  **dynamically** so the ~400 KB library stays out of the initial bundle and off
  the server.
- `PDFDocument.load(bytes, { updateMetadata: false })` on both read and write.
  Without it pdf-lib stamps its own `Producer` and `ModDate` onto a document the
  user only wanted to retitle.
- **Keywords are joined by hand.** `setKeywords(['a', 'b'])` writes `a b`,
  destroying the boundaries of multi-word keywords, so the array is joined with
  `', '` and passed as a single string. `lib/pdf.test.ts` guards this.
  (The PDF specification defines no separator for `/Keywords` at all — it is
  just a text string. Comma is the most widely used convention and what Acrobat
  shows, so that is what this tool reads and writes.)
- **A PDF stores its properties twice**, and both have to be written. See the
  XMP section below.
- Signature detection is a byte scan for `/ByteRange`. It cannot be guaranteed
  precise, which the FAQ discloses.
- Text fields have two normalisation levels: `sanitizeInput` runs on every
  keystroke (collapses line breaks, caps length) but deliberately does **not**
  trim, or typing a space before the next word would be impossible.
  `normalizeTextField` trims and is applied when reading and writing PDFs.
- All controls lock while any file is still being parsed — a bulk action aimed
  at a file whose metadata has not loaded yet would silently do nothing.
- The source `File` is never mutated; every output is a new `Blob`.

## XMP: the second copy of the metadata

A PDF can hold the same document properties in two places: the **Info
dictionary** and an **XMP packet** (an XML block in the catalog's `/Metadata`
stream). Writing only the Info dictionary leaves the two contradicting each
other, which was confirmed at byte level: after an edit, `/Title` held the new
value while `dc:title` still held the old one.

Which copy a reader trusts varies, and Acrobat's Document Properties reads XMP
when it is present — so a file edited without this sync can report the old title
in the place users go to check it.

`lib/xmp.ts` therefore keeps the overlapping properties in step:

| Info dictionary | XMP property | RDF container |
| --- | --- | --- |
| `/Title` | `dc:title` | `rdf:Alt` (`x-default`) |
| `/Author` | `dc:creator` | `rdf:Seq` |
| `/Subject` | `dc:description` | `rdf:Alt` (`x-default`) |
| `/Keywords` | `dc:subject` + `pdf:Keywords` | `rdf:Bag` / plain text |

Rules it follows:

- **Never invents an XMP packet.** A PDF without one is left alone; the Info
  dictionary is then the only answer any viewer can give.
- **Never destroys the rest of the packet.** Only the properties in the table
  are touched — `xmp:CreatorTool`, rights, and custom schemas survive. A packet
  that cannot be parsed is left exactly as it was, because a half-rewritten
  packet is worse than a stale one.
- **Removes rather than blanks.** Clearing a field deletes the XMP property, so
  the viewer falls back to the filename instead of showing an empty title.
- **Clears every copy.** XMP permits the same property in any `rdf:Description`
  and simple properties may be attributes, so all forms are removed before the
  new value is written.
- **Reads XMP as a fallback.** If the Info dictionary is blank but XMP has a
  value, the form shows the XMP value. Without this a title living only in XMP
  would display as empty here and then be silently deleted on save — a
  regression the XMP sync itself would have introduced.

Two encoding traps, both caught by tests:

- `PDFContext.stream()` writes **one byte per character** when handed a string,
  which mangles every non-ASCII title. The packet is encoded to UTF-8 explicitly.
- pdf-lib decides how to treat that value with `instanceof Uint8Array`, which is
  **false across realms**. Under jsdom, a `TextEncoder` array fails the check and
  silently falls back to the one-byte-per-character path, so the encoded bytes
  are copied with `Uint8Array.from`.

## Changes made after the first working version

Recorded because each of these was a real defect in a build that looked
finished, and the same mistakes are easy to repeat in the next tool.

### Bulk actions silently did nothing while PDFs were still parsing

Files are analysed one at a time after being dropped, and a file that has not
finished loading has no editable metadata yet. Every bulk action skipped those
files, so clicking *Use filename as title* immediately after a drop appeared to
do nothing at all — no error, no change. Found by an e2e test that clicked
faster than a human normally would, which is exactly why the test was worth
writing that way.

Fix: all controls are disabled while any file is still loading, and the run area
shows *Reading PDFs…* so the wait is visible rather than mysterious.

### Two buttons did the same thing

The per-card *Create PDF* button and the page-level *Create and download PDF*
button were identical whenever only one file was loaded — `createAll()` delegates
to `createSingle()` for a single target. Two controls with the same effect sitting
on one screen invites the user to wonder what they missed.

Fix: the per-card button is hidden when it is the only file, and is labelled
*Create this one* when there are several, so it reads as a contrast to *Create
all* rather than a duplicate of it.

### "Modified" was a claim with no evidence

The card header reported *Modified* but nothing indicated which of the five
editable values had actually changed — with *Other metadata* collapsed by
default, the changed field could be entirely off-screen.

Fix: `changedFields()` returns the exact set of differing values and is now the
**single source of truth** — the per-field dots, the collapsed-section dot, and
the header badge all derive from it, so they cannot disagree. It also settled an
inconsistency that existed beforehand: the header compared values exactly while
the fields hold untrimmed text mid-edit, so typing a trailing space marked a file
as modified. The comparison is now trimmed on both sides.

### The edit only reached half of the file

Only the Info dictionary was written, so a document carrying an XMP packet —
anything out of Adobe tools, InDesign, or many Office exports — was left with two
contradictory titles: the new one in `/Title`, the old one in `dc:title`.

Surfaced by a question about whether the Keywords convention was standard, which
led to checking where keywords are *supposed* to live (XMP `dc:subject`, a real
array) and from there to the discovery that the title had the same problem.

Fix: `lib/xmp.ts`, described above. Worth noting that the fix needed a second
half — reading XMP back as a fallback — because syncing on write alone would
have started deleting titles that existed only in XMP.

A note on how this was investigated, because the lesson generalises: a browser
tab showing an apparently unchanged title was taken as evidence of the bug, and
it was not — Chromium and Acrobat both put the **filename** in the tab, so the
title on screen was never the metadata at all. The byte-level check was the only
evidence that meant anything, and it was available from the start. Verify
against the file, not against a viewer's chrome.

### The badges were unreadable in dark mode

`Free` / `No sign-up` / `Processed in your browser` were painted with a
hard-coded navy, while the chip behind them is a themed token that flips to dark
brown after dark. Navy on dark brown measures **1.22:1** — effectively invisible.

The other two tools escaped this by using `color: inherit` on their chips; this
was the only hard-coded colour in the stylesheet, and it sat outside the token
block where the light/dark pairing is declared.

Fix: a `--chip-text` token declared next to `--chip-bg` in both themes, giving
14.53:1 on light and 11.89:1 on dark. **A colour that is written outside the
token block is a colour that only has one theme** — keep both values together so
the omission is visible while writing it.

### The guide had a heading level but no parent

Adding a *Guide* title above the explanatory sections could have been one more
`h2` beside them. That would have read as an empty section followed by six
siblings, rather than a guide containing six parts.

Fix: the sections were demoted to `h3` so the outline nests properly, with the
type scale adjusted to match — demoting alone would have left the section titles
the same size as body text.

### Trimming on every keystroke made fields unusable

Not a review finding but worth the same note: the first pass normalised text on
every change, including trimming. That makes it impossible to type a space
before the next word, because the space is removed as it is typed. Split into
`sanitizeInput` (per keystroke, no trim) and `normalizeTextField` (at the PDF
boundary, trims).

## Privacy

PDFs are read, edited, and rebuilt entirely in the browser. Nothing is uploaded,
no account is needed, and reloading the page discards everything. Analytics
events carry counts and non-sensitive outcomes only — never filenames, titles,
or any other user input.

## Tests

- `lib/filename.test.ts` — sanitisation, `.pdf` handling, duplicate numbering
- `lib/metadata.test.ts` — keyword parsing and round-trip, input normalisation
- `lib/validate.test.ts` — MIME/extension checks and the size/count limits
- `lib/edits.test.ts` — per-field edits, status transitions, batch modes, and
  `changedFields` (including that it agrees with the card status)
- `lib/pdf.test.ts` — real `pdf-lib` round-trips: Japanese and emoji metadata,
  keyword boundaries, blank clearing, page preservation, Producer preservation,
  source file left untouched
- `components/BatchActions.test.tsx` — affected counts per mode, disabled states
- `lib/xmp.test.ts` — the XMP transform in isolation: container shapes, removal
  on clear, copies in a second `rdf:Description`, attribute-form properties,
  refusal to touch unparseable packets (jsdom, for `DOMParser`)
- `lib/pdf-xmp.test.ts` — the same through a real PDF: stale XMP title replaced,
  unrelated XMP kept, XMP-only titles surfaced and not lost, no packet invented
- `components/FileCard.test.tsx` — where change markers appear, and when the
  per-card create button is offered
- `e2e/smoke.spec.ts` — single-file edit and download, non-PDF rejection, bulk
  apply plus ZIP, filename→title, reset/remove, the Japanese route, keyboard
  access to the dropzone
