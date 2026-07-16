# task5: Internationalization (English default / Japanese toggle)

> **Before starting**: Do this after task3 and task4 are complete. Review the
> actual component structure and UI copy; if this file differs from them,
> update this file before starting.

## Goal

Make the UI multilingual. English is the default, and a language switcher in
the header toggles to Japanese.

## Implementation policy

- **Do not add libraries** (react-i18next etc. are unnecessary). It is a
  single-page SPA with a limited amount of copy, so implement it with our own
  dictionaries + React Context
- Suggested structure:
  - `src/i18n/en.ts` / `src/i18n/ja.ts`: copy dictionaries (identical key
    structure; guarantee key parity between the two dictionaries with
    TypeScript types, e.g. type `ja` as `typeof en`)
  - `src/i18n/LocaleContext.tsx`: Context + Provider exposing the current
    language and a switch function
  - `useLocale()` hook: retrieve copy as `t('some.key')` or `t.someKey`
- Replace all hard-coded (Japanese) copy in components with dictionary
  lookups. **Dynamic copy must be covered too, without exception**: validation
  error messages, the preview's duplicate warning, the button's loading state,
  disabled-reason text, and so on
- Keep copy out of `src/lib/` (pure functions). Return errors as kinds
  (enum-like values) and convert them to display text in the UI layer
  (if task2's `validateTextValue` was implemented to return message strings,
  refactor it to return error codes and update the tests accordingly)

## Initial language and persistence

- The initial value is **English** (no automatic browser-language detection;
  keep it simple)
- Place the language switcher at the top right of the header (an `EN / 日本語`
  toggle or select)
- Persist the selected language to localStorage and restore it on the next
  visit (key example: `file-renamer:locale`)

## HTML meta information

- Change `<html lang>` dynamically with the language toggle (en / ja)
- Switch `document.title` and the meta description with the language as well
- Make index.html's static initial values English (matching the default
  language)

## Translation notes

- Suggested English names for tokens: 任意文字列 → Text, 区切り文字 →
  Separator, 日付 → Date, 時間 → Time, index → Index
- Do not vary the date/time **formats themselves** (yyyy-mm-dd etc.) by
  language. They are output specs the user chooses, not locale display
- The privacy statement must be shown in both languages. English example:
  "Your files never leave your browser. All processing happens locally."
  Japanese: 「ファイルはサーバーに送信されず、すべてブラウザ内で処理されます」

## Completion criteria

- The UI is shown in English on first visit
- Switching to Japanese switches all copy, both static and dynamic (errors,
  warnings, loading, etc.)
- The selected language persists across reloads
- `<html lang>` / title / meta description follow the language
- No hard-coded display copy remains in components
- `npm run build` / `npm run lint` / `npm run test` all pass

## Out of scope

- Adding a third language (but keep a structure where adding a dictionary
  file is enough)
- Language switching via URL path (/en/ etc.). It is an SPA, so language is
  client state
- Localizing date/time formats
- Installing additional libraries
