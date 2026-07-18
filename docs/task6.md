# task6: Image previews (thumbnails, size control, click-to-enlarge)

> **Note**: This feature was implemented ad hoc after task4 (before task5).
> This file records the shipped behavior, in the same spirit as task1.

## Goal

Help users decide the file order and check image quality (e.g. blurriness)
visually, instead of relying on file names alone.

## Behavior

### Thumbnails

- In the ① file list, a thumbnail is shown to the left of each file name;
  in the ③ preview table, a thumbnail column is the leftmost column
- Image files (`image/*` MIME types) are rendered via object URLs
  (`URL.createObjectURL`), square-cropped with `object-fit: cover`.
  Object URLs are revoked when the file is removed from the list
- Non-image files show a 📄 placeholder instead

### Size control

- A "画像サイズ − ＋" control sits in ① directly below the reorder hint
  ("ドラッグ&ドロップで並べ替えできます…"), shown only while files exist
- Range 24–164px in 20px steps, default 44px; the − / ＋ buttons disable at
  the limits
- The size is applied through a `--thumb-size` CSS variable, so ① and ③
  resize together

### Click-to-enlarge (lightbox)

- Clicking an image thumbnail (in ① or ③) opens a full-screen overlay
- The image is shown at its **natural size**, capped to fit the viewport
  (`max-width: calc(100vw - 3rem)`, `max-height: calc(100vh - 6rem)`,
  aspect ratio preserved); images smaller than the viewport are not upscaled
- The file name is shown as a caption; close via backdrop click, the ✕
  button, or the Escape key
- Clicking does not conflict with drag reordering (drags require 8px of
  pointer movement); placeholders (non-images) are not clickable

## Constraints

- No additional libraries; plain CSS; rendered via a React portal
- Everything stays in the browser (object URLs are local Blob references),
  consistent with the privacy policy in CLAUDE.md

## Completion criteria

- `npm run build` / `npm run lint` / `npm run test` all pass
- Verified in the browser: thumbnails render, resizing applies to ① and ③,
  and the lightbox opens/closes as specified

## Out of scope

- Image editing/rotation, EXIF handling, and video thumbnails
- Persisting the chosen thumbnail size
