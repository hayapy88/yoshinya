# Shared tool page structure

Every tool page opens and closes the same way. The working area in the middle is
the tool's own; everything around it is shared, so a visitor who has used one
tool already knows how to read the next one.

```
h1   <tool name>                     ToolIntro
     lead paragraph
     [無料] [登録不要] [ブラウザ内で処理]
     🔒 privacy note
h2   ① … ② … ③ …                     the tool's own working area
h2   使い方ガイド / Guide             ToolGuide
h3     (tool-specific sections)
h3     使い方 / How to use the tool
h3     こんなときに便利 / When is it useful?
h3     プライバシーと安全性 / Privacy and security
h3     よくある質問 / FAQ
h3     関連ツール / Related tools
```

## Components

| File | Responsibility |
| --- | --- |
| `app/components/tool/ToolIntro.tsx` | Title, lead, the three badges, privacy note |
| `app/components/tool/ToolGuide.tsx` | Guide sections, FAQ, related tools |
| `app/components/tool/types.ts` | `ToolGuideContent`, `GuideSection`, `TOOL_SLUGS` |
| `app/components/tool/tool-shared.css` | Styles for both, with its own light/dark tokens |

Each tool keeps its own namespaced stylesheet (`.pte-`, `.is-`, file-renamer's)
for its working area. The shared blocks declare their own tokens rather than
inheriting, because they render inside whichever tool root wraps them.

## Adding a tool

1. Add `lead` and `privacyNote` to the tool's page entry in `app/i18n/en.ts`,
   then match it in `ja.ts`. The badges come from the shared `toolBadges` block —
   do not write them per tool.
2. Add a `<slug>Guide` entry shaped like `ToolGuideContent`: `heading`,
   `sections[]`, `faqHeading`, `faq[]`, `relatedHeading`.
3. Add the slug to `TOOL_SLUGS` and `PAGE_KEY` in `ToolGuide.tsx`, so the new
   tool appears in every other tool's related list and vice versa.
4. Render `<ToolIntro …/>` at the top and `<ToolGuide guide={…} current="<slug>" />`
   at the bottom of the tool component.
5. In the route's `meta`, pass `faqJsonLd(t.<slug>Guide.faq)` and
   `breadcrumbJsonLd(...)` alongside the tool's `WebApplication` JSON-LD.

## Rules worth keeping

- **The three badges are shared strings.** They are the product's core promise;
  a tool that words them differently reads like a different site.
- **The privacy note is per tool but same-shaped.** Each names what it processes
  ("PDFはサーバーに送信されません" / "画像は…"), then repeats the identical second
  sentence. Image Sorter originally used a different sentence structure and had
  to be brought into line.
- **The FAQ rendered on the page is the same data as the `FAQPage` structured
  data.** They cannot drift apart, and invisible structured data is a
  manual-action risk.
- **Sections sit at `h3` under the guide's `h2`,** so the outline is
  `h1 → h2 → h3` with no skipped levels.
- **A tool never links to itself** in related tools; `ToolGuide` filters the
  current slug out.
- **The lead is capped at 44rem.** A line running the full container width is
  hard to track back to the next line.

## Tests

`e2e/smoke.spec.ts` has a `shared tool page structure` block that loops over
every tool and asserts the badges, the privacy note, the guide heading, all five
common section headings, and that related tools links to exactly the other two.
Adding a tool without its guide content will fail that loop.
