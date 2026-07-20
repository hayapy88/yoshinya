# File Renamer (よしにゃにファイルリネーム)

## Problem being solved

Renaming a batch of files by hand — adding a prefix, a date, or a sequence
number — is tedious and error-prone. Desktop tools exist but require
installation, and uploading files to an online service raises privacy
concerns. The File Renamer does the whole job in the browser: nothing is
installed and nothing is uploaded.

## Target users

- People organizing photos, scans, receipts, or reports into consistent names
- Anyone who needs `prefix_date_index.ext`-style naming without scripting
- Privacy-conscious users who won't upload files to third-party services

## Features

- **Upload**: drag & drop or file picker, any number of files
- **Reorder**: drag & drop sorting (dnd-kit); the order defines the index
- **Image previews**: thumbnails with adjustable size and a lightbox view
- **Rule builder**: compose the new name from tokens —
  - Text (validated against characters not allowed in file names)
  - Separator (`_`, `-`, `.`)
  - Date (`yyyy-mm-dd`, `yyyymmdd`, `yyyy-mm`, `yyyymm`; fixed date or each
    file's modified date)
  - Time (`hh-mm-ss`, `hh-mm`; Windows-safe separators)
  - Index (numeric with 1–3 digit padding, or alphabetic a/b/c… like Excel
    columns)
- **Live preview**: original → new name table, with duplicates flagged
- **Safety**: download is blocked while validation errors or duplicate names
  exist
- **Download**: a zip named `renamed_<date>-<time>.zip` built locally

## Technical approach

- Pure rename logic in `app/features/file-renamer/lib/` (`rename.ts`,
  `validate.ts`, `zip.ts`) with no DOM dependencies, fully covered by Vitest
- React components handle upload, ordering, and the token UI; state lives in
  `FileRenamerTool.tsx`
- JSZip assembles the archive in the browser; downloads use object URLs
- One shared implementation serves `/ja/file-renamer` and `/en/file-renamer`
  with labels from the typed i18n dictionaries

## Privacy considerations

- Files, file names, and contents never leave the browser; the server only
  renders the page shell
- The prepared (inactive) analytics events carry counts only — never file
  names
- The extension of each file is preserved, so no content sniffing is needed

## Edge cases

Covered by unit and end-to-end tests:

- Empty input and rule-less states (download stays disabled with a reason)
- Duplicate resulting names (flagged per row, download blocked)
- Japanese and emoji file names
- Very long names
- Multi-dot names (`archive.backup.tar.gz` → only `.gz` is the extension)
- Dotfiles (`.gitignore` is treated as a base name, not an extension)
- Files without extensions
- Forbidden characters in text tokens (`/ \ : * ? " < > |`)
- Repeated rename/download runs in one session

## Testing

- `npm test` — 55 Vitest tests: pure logic (including the edge cases above)
  and component regression tests (Testing Library + jsdom)
- `npm run e2e` — Playwright smoke tests covering the full workflow (upload →
  rule building via real drag & drop → duplicate resolution → zip download)
  in desktop and mobile viewports

## Future improvements

- Keyboard-accessible token insertion (the palette is currently drag-only)
- Find & replace and case-conversion tokens
- Persist the last used rule locally (respecting the no-upload promise)
- Optimized mascot/hero image variants (WebP) for faster first paint
