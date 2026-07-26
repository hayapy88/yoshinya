# YOSHINYA (よしにゃ)

**A little hassle? Leave it to Yoshinya! / ちょっと面倒？それ、よしにゃにおまかせ！**

Yoshinya is a collection of free, browser-based utility tools with a simple
promise: every tool runs entirely in your browser, so your files never leave
your device. A new tool ships every week, guided by the mascot **よしにゃん
(Yoshinyan)**.

- **Live URL**: https://yoshinya.com
- **X (Twitter)**: https://x.com/yoshinya_com

## Tools

| Tool | Japanese name | English name | Status |
| --- | --- | --- | --- |
| File Renamer | よしにゃにファイルリネーム | File Renamer by Yoshinya | Available |
| Image Sorter | よしにゃに画像仕分け | Image Sorter by Yoshinya | Available |

Yoshinya plans to release one new browser-based utility every week.

## Routes

| Page | Japanese | English |
| --- | --- | --- |
| Language gateway | `/` | `/` |
| Home | `/ja` | `/en` |
| File Renamer | `/ja/file-renamer` | `/en/file-renamer` |
| Image Sorter | `/ja/image-sorter` | `/en/image-sorter` |
| Privacy Policy | `/ja/privacy` | `/en/privacy` |
| Terms of Use | `/ja/terms` | `/en/terms` |

`sitemap.xml` and `robots.txt` are served as resource routes. Tool URLs live
directly under the locale (no `/tools/` segment), so future tools land at
`/ja/image-resizer`, `/en/pdf-merger`, and so on.

## Technical stack

- **Framework**: React 19 + React Router v8 (framework mode, SSR)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 (without preflight) + the tool's own CSS
- **Build**: Vite + Cloudflare Vite Plugin
- **Hosting**: Cloudflare Workers (SSR) + Workers Static Assets
- **Testing**: Vitest, React Testing Library, Playwright
- **Lint**: oxlint

Future backend needs (auth, billing, storage) are planned on the same stack
with Cloudflare D1, R2, KV, Turnstile, and Stripe — without replacing the
frontend framework or platform.

## Local development

Requires Node.js >= 22.22.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Environment variables

Copy `.env.example` to `.env` if needed.

| Variable | Purpose |
| --- | --- |
| `VITE_GA4_ID` | GA4 measurement ID. Optional; analytics stays fully inactive until an ID **and** a user consent flow exist (see `app/lib/analytics.ts`). |

No secrets are committed to the repository.

## Testing

```bash
npm test           # Vitest unit + component tests
npm run e2e        # Playwright smoke tests (desktop + mobile viewports)
npm run lint       # oxlint
npm run typecheck  # wrangler types + react-router typegen + tsc
npm run build      # production build
```

## Architecture

```
app/
  root.tsx             # document shell, favicons, html lang handling
  routes.ts            # route table
  routes/              # gateway, locale layout, home, tools, legal, sitemap, robots, 404
  features/
    file-renamer/      # tool components + pure rename logic (lib/) + tests
  components/layout/   # site header, footer, legal page renderer
  i18n/                # typed ja/en dictionaries (en.ts is the source of truth)
  lib/                 # seo helpers, analytics scaffolding
  legal/               # typed privacy/terms content for both locales
workers/app.ts         # Cloudflare Worker entry (SSR)
public/brand/          # approved brand assets (mascot, OGP, favicons)
docs/tools/            # per-tool documentation
e2e/                   # Playwright smoke tests
```

Locale handling: the URL drives the language (`/:locale`). The gateway at `/`
shows both languages, uses the browser language only as a recommendation, and
remembers an explicit choice in a cookie. The header switcher always opens the
equivalent page in the other language. Dictionaries are typed so a missing
translation key fails the type check.

## Privacy model

- Tools process files entirely in the browser (JSZip builds the download
  locally). Files and file names are never uploaded.
- The only cookie is `yoshinya_locale` (language preference).
- No analytics or ads are currently active.

## Release process

1. Build the tool as a feature module under `app/features/<tool>/` with pure,
   tested logic in `lib/`.
2. Wire it up: add the locale route in `app/routes.ts`, a locale-less redirect
   route (`route('<slug>', 'routes/locale-redirect.tsx', { id: 'redirect-<slug>' })`),
   dictionary entries (both locales), a `sitemap.ts` path, a homepage card, and
   a SEO JSON-LD helper in `app/lib/seo.ts`.
3. `npm test && npm run e2e && npm run typecheck && npm run build`
4. `npm run deploy` (Cloudflare Workers).

## Roadmap

- Weekly tools: image resizer, PDF merger, and more
- Optional accounts with saved preferences (Cloudflare D1/KV)
- Paid plan with storage-backed features (R2, Stripe)
- Analytics with a proper consent flow

## Contributing

This is currently a personal project and not open to external contributions,
but issues and feedback are welcome via X: [@yoshinya_com](https://x.com/yoshinya_com).

## Note on legal pages

The Privacy Policy and Terms of Use shipped with the site are concise initial
drafts written to match the actual implementation. They are not professional
legal advice and should be reviewed by the owner.
