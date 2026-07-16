# task1: Project foundation (scaffold, configuration, authentication)

> **Note**: This task has already been completed. This file was written afterwards
> as a record kept in docs/. See "Execution notes" at the end for details from the
> actual run.

## Goal

Build the project foundation for a fully client-side batch file renaming tool.
Feature implementation (rename functions, UI, zip) is out of scope for this task.

## Project overview

- Fully client-side SPA. No server, no database, and no file transfer to any
  external service (privacy is the selling point)
- Features: load multiple files → reorder via drag & drop → build a token-based
  rename rule → check the preview → download as a zip
- Stack: Vite + React + TypeScript + dnd-kit + JSZip + Vitest
- Deployment target: Cloudflare Workers (static asset serving; not Pages)

## Work items

1. Run `npm create cloudflare@latest` in non-interactive mode to create a project
   with the React + Vite + @cloudflare/vite-plugin setup
2. Since this is an SPA, confirm that wrangler.jsonc has
   `assets.not_found_handling: "single-page-application"`
3. Make it fully client-side: delete the demo Worker bundled with the template
   (worker/index.ts) and its related configuration (`main`, `nodejs_compat`, etc.
   in wrangler.jsonc), leaving a static-assets-only setup with no Worker script
4. Add dependencies: @dnd-kit/core / @dnd-kit/sortable / @dnd-kit/utilities /
   jszip / vitest (devDependencies)
5. Create CLAUDE.md and state the following policies:
   - Fully client-side SPA. Never add a server, database, or any transfer of
     files to external services
   - Deployment target is Cloudflare Workers static assets (keep the
     no-Worker-script setup)
   - Implement rename logic as pure functions under src/lib/ and always write
     Vitest tests for it
   - Do not introduce Next.js, API Routes, or any backend
6. Confirm the app starts locally with `npm run dev`
7. Authenticate with `wrangler login` (the user performs the browser approval
   step themselves). Verify with `wrangler whoami` afterwards
8. Run `git init`, review .gitignore, and create the initial commit

## Completion criteria

- `npm run dev` starts locally and returns HTTP 200
- `npm run build` / `npm run lint` pass
- wrangler is authenticated with the user's Cloudflare account
- The initial commit exists

## Out of scope

- Feature implementation (rename functions, UI, zip generation) → task2–4
- Production deploy (`npm run deploy`) → done at the end of task4

## Execution notes (2026-07-14)

- The scaffold succeeded with the combination `--framework=react
  --platform=workers --variant=react-ts --no-deploy --git=false`
  (TypeScript is selected via `--variant=react-ts`, not `--lang=ts`)
- The existing `.claude/` directory conflicted with the scaffold, so it was
  temporarily moved out and restored afterwards (settings.local.json confirmed
  present)
- `assets.not_found_handling: "single-page-application"` was already included
  in the template
- Added the `"deploy": "npm run build && wrangler deploy"` script to
  package.json and removed the unused `cf-typegen` script
- Setup: Vite 8 + React 19 + TypeScript + @cloudflare/vite-plugin (wrangler 4).
  Linting is oxlint (template default)
- Changed index.html to the Japanese locale with the title "File Renamer"
