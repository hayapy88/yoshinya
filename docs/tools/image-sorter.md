# Image Sorter (よしにゃに画像仕分け)

## Problem being solved

Sorting a batch of photos into categories with Finder/Explorer means opening
each image, remembering which folder it belongs to, and dragging it there — one
slow round trip per file. The Image Sorter keeps the image large on screen and
lets you drop it into a folder with a single key press, then moves on to the
next image automatically. The whole batch is downloaded as one zip with a
folder per category.

## Target users

- EC / marketplace staff sorting product shots (main / detail / lifestyle / rejected)
- Photographers triaging deliverables (keep / hold / drop)
- Real-estate, travel, or social teams grouping photos by room, city, or channel
- Anyone organising many images into folders without a desktop app or an upload

## English name

Following the existing "File Renamer by Yoshinya" convention:

- Tool name: **Image Sorter by Yoshinya**
- URL slug: `image-sorter` (`/ja/image-sorter`, `/en/image-sorter`)
- Japanese: **よしにゃに画像仕分け**

## Features

- **Add images**: drag & drop or file picker; non-image files are skipped with a
  clear notice. Two folders exist by default so you can start immediately.
- **Folders** (the sort destinations): add, rename, delete; numbered by order.
  Deleting a folder returns its images to *unsorted* (never deletes them).
- **Fast sorting**: the current image is shown large; press a number key
  (1–9) or tap a numbered folder button to file it and auto-advance to the next
  unsorted image.
  - `Space` repeats the previous folder (great for runs of similar images)
  - `←` / `→` move between images; touch users swipe left/right
  - `Backspace` or `Ctrl/⌘ + Z` (or the toast's Undo) reverts the last action
  - Zoom in / out / reset (buttons on all devices, wheel on desktop)
- **Review**: images are grouped under each folder (and an always-present
  *unsorted* group) as a list with visible file names. Select images (click,
  Shift-range, or select all) and move them via a dropdown, or drag selected
  images onto a folder. The unsorted group is a drop target too.
- **Download**: one zip, a folder per non-empty folder. If images are still
  unsorted, a dialog offers to download without them or to include them in an
  "Unsorted" folder. The file name carries the date/time
  (`image-sorting_yyyy-mm-dd-hh-mm-ss.zip`).

## Technical approach

- All state lives in a pure reducer (`lib/reducer.ts`): add/sort/move/undo,
  folder management, and derived counts. Ids are passed into actions so the
  reducer stays deterministic and unit-testable.
- Images reference their folder by id, never by name, so renaming a folder
  never breaks assignments. Undo records the previous folder of every touched
  image, so a single sort and a bulk move each revert as one step.
- Pure helpers for the risky parts: `sanitize.ts` (folder-name sanitising,
  filename dedupe) and `zip-entries.ts` (folder/file layout). JSZip builds the
  archive in the browser.
- UI is split into `Dropzone`, `FolderManager`, `SortingView`, `ReviewView`,
  orchestrated by `ImageSorterTool`. One shared implementation serves both
  locales from the typed i18n dictionaries.
- Drag-and-drop reuses `@dnd-kit/core` (already a dependency from the File
  Renamer). Touch drag uses press-and-hold so normal scrolling still works; the
  select→move path remains for keyboard and mobile.
- Browser APIs (object URLs, `crypto.randomUUID`) are only touched in event
  handlers, so nothing runs during SSR.

## Privacy considerations

- Images, file names, and contents never leave the browser; the server only
  renders the page shell.
- Object URLs are revoked when an image is removed and when the tool unmounts.
- Analytics events (when active) carry only counts — never file names.
- Original files are never modified or deleted; the output is a zip of copies.

## Edge cases

Covered by unit, component, and end-to-end tests:

- Empty state (no images / no folders); download blocked with a reason
- Deleting a folder that contains images (they return to unsorted, kept)
- Number keys beyond the folder count, and folders past 9 (button-only)
- Not firing shortcuts while typing in the folder-name field
- Duplicate folder names and unsafe characters (sanitised, uniquified)
- Duplicate file names within a folder (deduplicated, nothing lost)
- Failed image loads (skippable)
- Unsorted images remaining at download time (warned, with choices)

## Testing

- `npm test` — Vitest: reducer, sanitise, and zip-layout units, plus
  component tests for the sorting shortcuts and the review/move UI.
- `npm run e2e` — Playwright: add images → sort by keyboard (number + Space) →
  fix an assignment in review → download a dated zip, in desktop and mobile
  viewports.

## Future improvements

- Optional pinch-to-zoom on touch
- Reordering folders
- Virtualized thumbnails for very large batches
- Remembering the last session locally (respecting the no-upload promise)
