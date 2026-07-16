# task2: Rename logic (pure functions + tests)

## Goal

Implement, under `src/lib/`, a set of pure functions that generate the list of
new file names from a rename rule expressed as a sequence of tokens. Do not
implement any UI (that happens in task3).

## Background (overall app spec)

The user builds the file naming rule by arranging "tokens" via drag & drop.
Example: `[text1][_][date(yyyy-mm-dd)][_][text2][_][index(01)].ext`

- For each text token placed, an input field is shown and the user enters its
  value
- Date/time tokens can use either "a fixed date/time specified by the user" or
  "each file's last-modified time" as their source (the fixed date/time is
  chosen with a calendar/time picker on the UI side)
- The index token can be numeric (zero-padded to 1–3 digits) or an alphabetic
  sequence
- The extension of the original file is always preserved (it is not a token)

In task2 we build the data model that expresses this rule and the functions
that apply it.

## Data model (src/lib/types.ts)

Use the following as the baseline. It may be adjusted for implementation
convenience, but keep it a discriminated union.

```ts
export type DateFormat = 'yyyy-mm-dd' | 'yyyy-m-d' | 'm-d' | 'd-m-yyyy';
export type TimeFormat = 'hh-mm-ss' | 'hh-mm';
// Both must be structured so new literals can be added easily later.
// Do not use ':' as the time separator (it is not allowed in Windows file
// names, so use '-').

export type DateTimeSource = 'fixed' | 'fileModified';
// fixed: a date/time the user picked (shared by all files)
// fileModified: each file's last-modified time (differs per file)

export type IndexStyle =
  | { type: 'numeric'; padding: 1 | 2 | 3 }      // 1 / 01 / 001
  | { type: 'alpha'; letterCase: 'lower' | 'upper' }; // a, b, ... / A, B, ...

export type RenameToken =
  | { id: string; kind: 'text'; value: string }
  | { id: string; kind: 'separator'; char: string }   // default '_'
  | { id: string; kind: 'date'; format: DateFormat; source: DateTimeSource;
      fixedDate?: string }  // when source='fixed': ISO string 'yyyy-mm-dd'
  | { id: string; kind: 'time'; format: TimeFormat; source: DateTimeSource;
      fixedTime?: string }  // when source='fixed': 'hh:mm' or 'hh:mm:ss'
  | { id: string; kind: 'index'; style: IndexStyle; start: number }; // start defaults to 1

export type RenameInput = {
  originalName: string;
  lastModified: number;  // pass File.lastModified (epoch ms) as-is
};
```

## Functions to implement (src/lib/rename.ts)

All pure functions. They must not depend on the DOM, React, or the File API.

1. `formatDate(date: Date, format: DateFormat): string`
2. `formatTime(date: Date, format: TimeFormat): string`
   - e.g. 9:05:03 with hh-mm-ss → `"09-05-03"` (hours/minutes/seconds are
     always zero-padded to 2 digits)
3. `formatNumericIndex(n: number, padding: 1 | 2 | 3): string`
   - On overflow (e.g. padding=2 with n=100), return the number as-is without
     padding: `"100"`
4. `formatAlphaIndex(n: number, letterCase: 'lower' | 'upper'): string`
   - 1→a, 2→b, ..., 26→z, 27→aa, 28→ab ... (bijective base-26, same as Excel
     column names)
5. `splitExtension(fileName: string): { base: string; ext: string }`
   - `"photo.JPG"` → `{ base: "photo", ext: ".JPG" }` (case is preserved)
   - No extension → `ext: ""`
   - Dotfiles such as `".gitignore"` → treat the whole name as base, `ext: ""`
   - `"archive.tar.gz"` → `ext: ".gz"` (only after the last dot)
6. `buildFileName(tokens: RenameToken[], context: { index: number; fileDate: Date; now: Date }): string`
   - Concatenate the token sequence to produce the new file name without the
     extension
   - date/time tokens use fixedDate/fixedTime or fileDate depending on source
   - If source='fixed' but fixedDate/fixedTime is unset, fall back to now
7. `applyRename(inputs: RenameInput[], tokens: RenameToken[], options: { now: Date }): RenameResult[]`

```ts
export type RenameResult = {
  originalName: string;
  newName: string;       // including the extension
  isDuplicate: boolean;  // true when the same name appears in the results
};
```

- The order of the files directly determines the index order (reordering is
  the UI's responsibility)
- `now` is received as an argument (for testability; the UI is expected to
  pass the current time)

## Validation (src/lib/validate.ts)

`validateTextValue(value: string): string | null` (error message or null)

- Error when the value contains characters not allowed in file names
  (`/ \ : * ? " < > |`)
- Empty strings are allowed (whether to warn in the UI is decided in task3)

## Tests (src/lib/*.test.ts)

Cover at least the following with Vitest:

- Output of every DateFormat (verify with a date containing a single-digit
  month and day, e.g. 2026-07-05)
- Output of every TimeFormat (verify with a time containing single-digit
  hours/minutes/seconds, e.g. 09:05:03)
- formatNumericIndex: every padding and the overflow case
- formatAlphaIndex: 1→a, 26→z, 27→aa, 52→az, 53→ba, upper/lower case
- splitExtension edge cases (no extension, dotfile, multiple extensions,
  uppercase extension)
- buildFileName: switching between source='fixed' and 'fileModified', and the
  fallback when fixed values are unset
- applyRename: the normal case, a case producing duplicate names without an
  index token (isDuplicate=true), and a case where the fileModified source
  yields a different date per file
- validateTextValue forbidden characters

## Completion criteria

- `npm run test` passes in full
- `npm run build` and `npm run lint` pass
- src/lib/ contains pure functions only (no react/dom-related imports)

## Out of scope

- UI implementation (upload, D&D, calendar/time picker, preview display) → task3
- zip generation → task4
- Installing additional libraries
