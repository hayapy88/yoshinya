# CSV Encoding Fixer (よしにゃにCSV文字化け修復)

## Problem being solved

A CSV opens as rows of meaningless characters in Excel while the same file
reads perfectly in Google Sheets. The file is not damaged and nothing about it
needs repairing — the two programs disagree about how to read it.

Nothing inside a CSV records its encoding, so every program decides for itself.
Google Sheets inspects the bytes and defaults to UTF-8. Excel, when a `.csv` is
opened by double-click, inspects nothing: it uses the system code page, which on
a Japanese Windows machine is Shift_JIS. UTF-8 spends three bytes on a Japanese
character where Shift_JIS expects two, so the boundaries fall in the wrong place
and the text comes out as unrelated kanji.

Excel behaves this way for compatibility, and makes one exception: a file that
begins with a three-byte marker (a BOM) is read as UTF-8. The same file also
opens correctly through **Data > From Text/CSV**, which does inspect the
contents. It is the double-click path alone that is stuck in the past.

So the common case needs no conversion at all — three bytes at the front, and
Excel reads the file it was already able to read.

## Target users

Office workers exporting from accounting, e-commerce and in-house systems, and
anyone importing a CSV somebody else produced. The tool assumes no knowledge of
character encodings: the words *UTF-8*, *Shift_JIS* and *BOM* are explained on
the page before they are used.

## Naming

| | |
| --- | --- |
| Japanese | よしにゃにCSV文字化け修復 |
| English | CSV Encoding Fixer by Yoshinya |
| Slug | `csv-encoding-fixer` |

## Features

- Reads `.csv`, `.tsv` and `.txt`; up to 50 files, 50 MB each.
- Detects UTF-8 (with or without BOM), UTF-16 LE/BE, Shift_JIS and EUC-JP.
- Reports the verdict per file **before** anything is converted, in one of three
  forms: nothing needed, marker only, or conversion.
- Shows a decoded preview, so the verdict can be checked rather than trusted.
- Flags files whose text was already destroyed, instead of returning a tidier
  copy with the same holes.
- Downloads UTF-8 with a BOM, named `sales.csv` → `sales_utf8.csv`.

## The file is never parsed as a CSV

Commas, quotes and newlines are never interpreted. The file is bytes on the way
in and bytes on the way out.

This is the design decision the whole tool rests on. A CSV parser would have to
take a position on quoting styles, embedded newlines and trailing separators,
and every one of those positions is a way to hand back a file that is subtly
different from the one that arrived. Not parsing removes that entire class of
failure: there is no code path that could reorder a row or drop a field, because
no code here knows what a row or a field is.

## Detection

1. `FF FE` or `FE FF` at the start is UTF-16, little or big endian.
2. If `TextDecoder('utf-8', { fatal: true })` accepts the bytes, it is UTF-8.
   This carries most of the work: UTF-8's multi-byte sequences are structured
   enough that Japanese text in another encoding almost never satisfies them by
   accident.
3. Otherwise decode as both Shift_JIS and EUC-JP and take the lower score:

```
score = replacement characters × 10 + half-width katakana
```

### Why half-width katakana is in the score

Counting replacement characters alone gets EUC-JP wrong every time.

EUC-JP puts every byte at or above `0xA1`, and Shift_JIS maps that range to
half-width katakana. So EUC-JP text decoded as Shift_JIS produces **no
replacement characters at all** — just a line of `ｱｲｳ`. Both decoders return a
clean result, the score ties, and the tie-break picks Shift_JIS.

Real Japanese CSVs are written in full-width, so a decode that comes out mostly
half-width has read the file wrong. That is what the second term measures. The
unit test asserts the trap directly — that Shift_JIS decodes the EUC-JP sample
without complaint — so the reason the term exists cannot be edited away by
someone who reads only the formula.

Shift_JIS wins a genuine tie: it is what Japanese business systems export.

## A UTF-8 file keeps its exact bytes

The page tells the user that nothing but the marker changes. That sentence is a
promise about their data, so the code makes it true rather than nearly true: a
file already in UTF-8 is not decoded and re-encoded, it is copied with three
bytes in front.

A round trip would produce identical output in almost every case. Almost is not
a promise worth making about someone's export — a lone surrogate or an unusual
normalisation would come back changed, and the user was told it would not. The
byte-for-byte equality is pinned by a test, and again by an end-to-end test that
reads the actual downloaded file.

Conversion from another encoding does rewrite the bytes, necessarily. The text
is what is preserved there, not the bytes.

## Saying when a file cannot be fixed

If replacement characters survive the decode, the bytes were already destroyed
before the file arrived — someone read it with the wrong encoding and saved it.
Nothing can recover that; the export has to be run again.

The tool says so. Converting anyway would produce a file that looks healthier
and carries exactly the same gaps, which is worse than an error because it ends
the investigation. The one thing the user needs to know is that they must go
back to the source.

## Three verdicts, all of them spoken

The tool never silently fixes anything. Each file gets a sentence naming what it
actually is and what the download will do:

| State | What the user is told |
| --- | --- |
| UTF-8, no marker | The text is fine; Excel just needs the marker. Three bytes are added and nothing else changes. |
| Shift_JIS or EUC-JP | Modern tools no longer assume this encoding; the download converts it. |
| UTF-8 with marker | Nothing is wrong; it should already open correctly. |

Conversion tools generally offer an operation and return a file, which leaves
the user no wiser and no better able to handle it next time. The value here is
as much the explanation as the download — which is why the guide opens with the
cause rather than the instructions.

The most common state, UTF-8 with no marker, is badged in the accent colour so
it can be picked out of a list of twenty files at a glance.

## The download is renamed

`sales.csv` becomes `sales_utf8.csv`. The fix is invisible from the outside —
same rows, same columns — so two indistinguishable files would end up side by
side in the downloads folder. The suffix is what stops the wrong one being sent
on.

The last dot is the extension, so `2026.04.sales.csv` keeps its dots, and a
leading dot is not an extension, so `.hidden` becomes `.hidden_utf8`.

## When the encoding was never the problem

A 4.6 MB Webflow content export was reported: garbled in Excel, fixed by this
tool, and then Excel hung on the result and had to be killed.

The fix was correct — the saved file was the original bytes with three bytes in
front, verified byte for byte. What changed is that Excel could finally read the
file, and the file is one Excel cannot cope with: 703 rows across 21 columns
with one column holding whole HTML article bodies, up to 29,275 characters a
cell and a longest line of 53 KB.

Three cut-down versions isolated it. Fifty rows with that column opened fine.
All 703 rows without that column opened fine. All 703 rows with it hung, and
stripping the file's eleven emoji changed nothing. So neither the row count nor
the long cells alone is the problem — the volume of long-text content is, and
it was there before the encoding was touched.

The tool now says so when a file is over 2 MB **and** has lines longer than
8 KB. Both conditions, because an ordinary large CSV of numbers opens without
complaint and warning about it would be noise. Line length is measured between
newline bytes rather than by parsing fields, so the promise that this tool never
interprets CSV structure still holds.

The warning appears alongside a successful fix rather than instead of it. The
file really was fixed, and other tools will now read it correctly; it is Excel
specifically that will not. Handing back a correctly encoded file that Excel
still cannot open, with no explanation, is how a working tool looks broken.

## What it does not do

- **Convert to Shift_JIS.** Browsers can read the legacy Japanese encodings but
  can only write UTF-8, so this would need a library. The usual reason to want
  it — opening the file in Excel — is solved by the marker instead. A system
  that will only accept Shift_JIS is not served by this tool.
- **Fix an .xlsx.** Its text is always stored as UTF-8 inside the archive, so
  this problem cannot arise; garbled text in an .xlsx was garbled before it was
  saved.
- **Recover destroyed text**, as above.

## Implementation notes

- No Web Worker: this reads bytes rather than decoding images, so there is
  nothing long enough to block on.
- No new dependencies. `TextDecoder` handles the legacy tables natively, which
  is the reason the tool is as small as it is.
- The file input's `accept` is deliberately wide (`.csv,.tsv,.txt,text/csv,
  text/plain`). CSVs routinely arrive as `text/plain` or with no type at all,
  and a filter that hides the user's own file from the picker is worse than one
  that lets an odd file through to a clear message.
- Downloads are typed `text/csv` rather than reusing the original type, because
  some systems export CSV as `application/octet-stream`.

## Privacy

Reading, detection and conversion all happen in the browser. No file, file name
or verdict is sent anywhere; analytics carries counts and the tool slug only.
This matters more here than in most of the tools — the files are exports, and
exports are customer lists.

## Tests

Unit tests cover detection for each encoding, the EUC-JP trap described above,
damage detection, byte preservation, double-BOM avoidance, the name suffix, and
the size and count limits including a second batch counting against the first.

Browser tests confirm what unit tests cannot: that a real browser's
`TextDecoder` handles Shift_JIS, and that the downloaded bytes are the BOM
followed by the original file unchanged. Both were checked in Chromium and
Firefox before the tool was considered working.
