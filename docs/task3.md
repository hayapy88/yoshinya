# task3: UI implementation (upload → rule builder → preview)

> **Before starting**: After task2 is complete, review the actually implemented
> types and function interfaces; if this file differs from them, update this
> file first, then start implementing.

## Goal

Implement a single-page UI consisting of the three steps below. The zip
download happens in task4, so at this stage the "confirm" button only needs to
be placed (disabled, or up to a console.log).

```
(1) Upload files
(2) Build the rename rule (token D&D + per-token settings UI)
(3) Preview the new file names
```

## (1) File upload

- Drop zone + click to open the file picker dialog
  (`<input type="file" multiple>`)
- Images are the expected use case, but do not reject by MIME type (accepting
  all files is fine)
- Files are **kept in browser memory only**. Never send them anywhere
- Keep File.lastModified so it can be passed to task2's RenameInput
- Show the loaded files in a list, supporting:
  - Reordering via drag & drop with dnd-kit (this order becomes the index
    order)
  - Removing individual files
  - Uploading more files (appended to the end of the existing list)

## (2) Rename rule builder (the core of this app)

### Token palette

Show a palette listing the available tokens:

- Text
- Separator (default `_`)
- Date
- Time
- Index

### Rule area

- Drag tokens from the palette into the rule area (dnd-kit)
- Tokens inside the rule area can be reordered via D&D and removed
- Multiple tokens of the same kind can be placed (e.g. two text tokens)
- Always show a fixed `.ext` indicator at the end of the rule area to convey
  that the extension is preserved automatically

### Per-token settings UI

- **Text**: below the rule area, show as many input fields as there are text
  tokens placed in the rule area (labeled `Text 1`, `Text 2`, ...). Show no
  input fields when none are placed.
  Validate with task2's `validateTextValue` and show errors under the field
- **Separator**: a settings panel lets the user choose the character: `_`
  (underscore) or `-` (hyphen)
- **Date**: placing/selecting a date token in the rule area shows a settings
  panel:
  - Format selection (all DateFormat variants from task2)
  - Source selection: "Pick a date" (default: today) / "Use file modified
    time"
  - When "Pick a date" is selected, choose the date with a **calendar UI via
    `<input type="date">`**. Use the native date input; do not add a calendar
    library
  - When "Use file modified time" is selected, show no calendar
- **Time**: a settings panel with the same structure as Date:
  - Format selection (all TimeFormat variants from task2)
  - Source selection: "Pick a time" (default: current time) / "Use file
    modified time"
  - When "Pick a time" is selected, choose the time with a **time picker UI
    via `<input type="time">`**. When the format includes seconds, set
    `step="1"` so seconds can be selected
- **Index**: choose the style in a settings panel:
  - Numeric 1 digit (1, 2, 3...) / numeric 2 digits (01, 02...) / numeric 3
    digits (001, 002...)
  - Alphabetic lowercase (a, b, c...) / alphabetic uppercase (A, B, C...)

### State management

- Keep `RenameToken[]` as a single piece of state, in a shape that can be
  passed directly to task2's `applyRename`
- Use only React's useState / useReducer for state management. Do not add an
  external state management library

## (3) Preview

- Whenever the file list or the rule (token sequence + each setting) changes,
  call `applyRename` and immediately show the "original name → new name"
  mapping list
- When the source is "file modified time", each file's distinct date/time must
  be reflected correctly in the preview
- Style rows with `isDuplicate: true` as warnings (color + icon etc.) and show
  a notice above the list saying duplicate file names will occur
- When no files are selected or the rule is empty, show guidance text instead
  of the preview

## Design policy

- Japanese UI. A simple, clean style is fine (plain CSS or CSS Modules; do not
  add Tailwind etc.)
- Single-column layout with (1)→(2)→(3) stacked vertically. Responsive enough
  not to break on mobile

## Completion criteria

- Selecting multiple files → reordering → assembling tokens → configuring each
  token updates the preview in real time as specified
- The number of text tokens and the number of input fields always match
- Picking a date from the calendar on a date token is reflected in the preview
- Picking a time on a time token is reflected in the preview (including
  formats with seconds)
- Switching the source to "file modified time" reflects each file's own
  date/time
- `npm run build` / `npm run lint` / `npm run test` all pass

## Out of scope

- zip generation/download → task4
- Changing the rename logic (if a change becomes necessary, report it and get
  confirmation first)
- Installing additional libraries (use the already-installed dnd-kit; use the
  native input type="date" / "time" for the calendar/time pickers)
