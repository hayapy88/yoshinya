# Yoshinya (よしにゃ)

A collection of free browser-based utility tools, released one per week.
Japanese and English are first-class languages. The first tool is the File
Renamer (よしにゃにファイルリネーム / File Renamer by Yoshinya).

## Non-negotiable rules

- **Tool processing is fully client-side.** Users' files and file names must
  never be sent to the Worker or any server. SSR renders pages only.
- **Deploy target is Cloudflare Workers** (SSR via React Router v8 framework
  mode; static assets via Workers Static Assets). Do not migrate to another
  framework or platform casually.
- **Both locales stay in sync.** Every public Japanese page has an English
  equivalent (and vice versa). Dictionaries are typed: a missing key in
  `app/i18n/ja.ts` fails `npm run typecheck`.
- **English for code, comments, commits, and docs.** Japanese belongs in the
  Japanese UI copy, Japanese metadata, and translation files.
- **Do not activate analytics.** The scaffolding in `app/lib/analytics.ts`
  stays inactive until a GA4 ID is provided via `VITE_GA4_ID` and a real
  consent flow exists. Events must never contain file names or contents.

## Architecture

- `app/routes.ts` — route table: `/` (language gateway), `/:locale` layout
  with home, `file-renamer`, `privacy`, `terms`, plus `sitemap.xml`,
  `robots.txt`, and a catch-all 404.
- `app/features/file-renamer/` — the tool: components, pure logic in `lib/`
  (always Vitest-tested), and its stylesheet.
- `app/i18n/` — typed dictionaries (`en.ts` is the source of truth).
- `app/lib/seo.ts` — canonical/hreflang/OGP/JSON-LD helpers; non-production
  hosts get noindex automatically.
- `workers/app.ts` — Worker entry (SSR request handler).
- New tools: add a feature folder, a route file per the existing pattern,
  dictionary entries, and a sitemap path in `app/routes/sitemap.ts`.

## Commands

- `npm run dev` — dev server
- `npm test` — Vitest (unit + component)
- `npm run e2e` — Playwright smoke tests (desktop + mobile)
- `npm run lint` — oxlint
- `npm run typecheck` — wrangler types + react-router typegen + tsc
- `npm run build` — production build
- `npm run deploy` — build and deploy to Cloudflare Workers

Node >= 22.22 is required (react-router v8).
