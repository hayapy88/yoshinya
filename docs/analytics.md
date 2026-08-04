# Analytics

GA4 property `G-5M9ZWGZJ0J`, loaded with gtag.js from `app/root.tsx`. All
configuration lives in this repository — there is no tag manager container in
the path.

## Why it is in code

The site previously loaded Google Tag Manager, with the GA4 tag configured
inside the container. It worked, but the configuration was invisible to anyone
reading the repository, and that cost real time: an audit concluded the site had
no analytics at all, because `CLAUDE.md` said analytics was disabled and
`app/lib/analytics.ts` was dead scaffolding. Neither statement was true, and
nothing in the code said so.

Keeping it in code means the configuration is reviewable, versioned, and
changeable by whoever is editing the codebase. It is also one script lighter: a
Tag Manager container loads the same GA4 library on top of itself.

The trade-off is that a future non-GA4 tag needs a code change and a deploy.
That is cheap here — deploys take seconds and happen weekly — and nobody outside
the repository needs to add tags. If that changes, putting the Tag Manager
snippet back is a small edit; the measurement id is unchanged, so history is
continuous either way.

## How it loads

`app/root.tsx` renders the standard two-part snippet **only when the host is a
production domain**, so local development and preview deployments never pollute
the data.

The inline stub must stay ahead of the library: it defines the `dataLayer` queue
that `gtag()` writes into, so an event fired before the download finishes is
replayed rather than dropped. Calling `window.gtag?.()` without that stub would
silently lose early events — which is exactly what the previous version of
`analytics.ts` did.

## Events

`app/lib/analytics.ts` is the typed front door. Every event is named in
`AnalyticsEvent`, so a typo fails the build instead of quietly costing a metric.

| Event | Parameters | Fired when |
| --- | --- | --- |
| `tool_opened` | `tool` | A tool page mounts |
| `files_added` | `tool`, `file_count` | Files are accepted into a tool |
| `rename_preview_generated` | `tool`, `file_count` | File Renamer produces its first preview |
| `download_completed` | `tool`, `file_count` | A download is handed to the browser |
| `batch_action` | `tool`, `action`, `mode` | A bulk edit is applied |
| `language_changed` | `to` | The header language switch is used |

`action` is the **field name** being filled (`title`, `author`, …), never the
value the user typed.

## The privacy rule

Events carry counts, tool slugs, and fixed enum-like values. Never a file name,
never file contents, never free-form input. `AnalyticsParams` lists its keys
explicitly rather than accepting `Record<string, string | number>`, so adding a
field that could hold user text takes a deliberate edit — and `analytics.test.ts`
pins the runtime behaviour to the same promise.

This matters more here than on a typical site: the whole product promise is that
files never leave the device. An event leaking a filename would break that
promise for real, not just on paper.

## What still needs the GA4 UI

Event names appear in reports automatically. Parameters need registering as
custom definitions before they can be broken out in standard reports:

| Parameter | Register as |
| --- | --- |
| `file_count` | Custom metric |
| `tool` | Custom dimension (optional — each tool has its own URL, so page path already segments) |
| `action`, `mode` | Custom dimensions |

None of this blocks collection; it only affects reporting. The most useful
number, **completion rate** (`download_completed` ÷ `tool_opened`, split by page
path), works with no registration at all.

## Verifying a change

Editing the snippet is easy to get subtly wrong in a way no test catches, so
after deploying:

1. Confirm the production HTML contains `gtag/js?id=G-5M9ZWGZJ0J`.
2. Open a tool, run it, and watch the events land in **GA4 → Realtime**.

Code being correct and events actually arriving are two different claims.
