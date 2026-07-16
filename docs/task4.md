# task4: zip generation/download + polish

> **Before starting**: After task3 is complete, review the actual component
> structure and state layout; if this file differs from them, update this file
> before starting.

## Goal

Implement the "confirm and download" button shown after the preview, so the
renamed files can be downloaded as a zip. Also do the pre-release polish.

## zip generation (JSZip)

- Enable the "confirm" button placed in task3
- Flow on click:
  1. Use the current `RenameResult[]` as the final values
  2. With JSZip, add each held File object under its new file name
  3. If there is even one `isDuplicate`, the button must not be clickable
     (disabled + show the reason)
  4. Generate a Blob with `zip.generateAsync({ type: 'blob' })` and trigger
     the download via `URL.createObjectURL` + an anchor click
  5. Clean up with `URL.revokeObjectURL` afterwards
- The zip file name is `renamed_yyyy-mm-dd.zip` (today's date)
- Show a loading state on the button while generating and prevent double
  clicks
- Considering large file counts/sizes, wrap generation in try-catch and show
  an error message on failure

## Validation (final checks before download)

Disable the button and show the reason when any of the following applies:

- No files
- The rule (tokens) is empty
- A text field has a validation error
- The preview contains duplicate file names

## Polish

- Add a one-or-two-sentence description of the tool at the top of the page.
  It must include the privacy sentence: "Files are never sent to a server;
  everything is processed inside your browser."
- Tidy up index.html's title / meta description (in Japanese)
- Verify the main flow: upload → reorder → build the rule → preview →
  download → unzip and confirm the file names inside are correct
- Confirm `npm run build` / `npm run lint` / `npm run test` all pass

## Deploy (done at the end of this task)

1. Check behavior on the Workers runtime with `npm run preview`
2. If all is well, **propose running `npm run deploy` and get approval before
   executing** (never deploy on your own)
3. After deploying, report the `*.workers.dev` URL

## Completion criteria

- The full flow through zip download works with real files
- File names inside the extracted zip match the preview exactly, and the file
  contents are identical to the originals
- Downloads are properly blocked in abnormal cases (duplicate names, missing
  input, etc.)
- Behavior is verified on the production URL

## Out of scope

- New features (additional date formats etc. are separate future tasks)
- Installing additional libraries
- Custom domain setup (separately, if it becomes necessary)
