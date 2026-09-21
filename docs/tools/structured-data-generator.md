# Structured Data Generator (よしにゃに構造化データ作成)

Week 10. A form that produces JSON-LD structured data for six schema.org types
and says which page of a site it belongs on. Everything runs in the browser:
`/ja/structured-data-generator` and `/en/structured-data-generator`.

## Problem being solved

Adding structured data to a site is a copy-and-edit job with no feedback until
the validator: open the schema.org docs, copy someone's snippet, change the
values, and discover the missing brace or the field that should not be there
only when Google's Rich Results Test rejects it. And once it passes, the second
question — which page does this go on, and where in the HTML — is answered
nowhere in the snippet itself.

Concrete jobs it kills:

- Writing an Article block for every blog post by hand.
- Getting a shop's address, opening hours and coordinates into a LocalBusiness
  block without knowing which properties exist.
- Working out which of the thirty properties in a copied Product snippet to
  keep.
- Pasting Organization on every page when it belongs on the homepage alone.

## Why a generator and not a validator

Google's Rich Results Test and schema.org's Schema Markup Validator already
exist and are authoritative; a third validator would be worse than both. The
gap is upstream of them: producing correct code in the first place, and saying
where it goes. The tool links to both validators as the last step.

## Target users

People running their own site's SEO, freelancers handing over a WordPress or
STUDIO build with "structured data" still on the checklist, shop and clinic
owners, and developers who would rather fill a form than reread the docs.

## Naming

JA `よしにゃに構造化データ作成`, EN `Structured Data Generator by Yoshinya`. The
JA title leads with `JSON-LDをフォームで生成`; the tool name already carries
`構造化データ`, so the leading phrase spends its space on the other query
cluster.

## The types are data, not code

`lib/schemas.ts` declares each type as a list of fields: an id, the output path
(`['address', 'streetAddress']`), a kind (`text`, `url`, `textarea`, `lines`,
`date`, `number`, `select`, or `repeat`), whether Google lists it as required,
and select options. Nested objects get their `@type` from a per-type map keyed
by dotted path (`publisher.logo` → `ImageObject`). A field whose path is
`['@type']` lets a select choose the root type (Article / NewsArticle /
BlogPosting; LocalBusiness / Restaurant / …).

The builder, the form, the storage code and the tests never name a type. Adding
Event or Recipe is a new entry here plus labels in both dictionaries.

Field ids are shared across types on purpose — `name` on an Organization and
on a Product get one label — and the full list is `FIELD_IDS`. The component
indexes the dictionary's `fields` block with that union, so a label missing
from `en.ts` fails `typecheck`, and `ja.ts` must mirror `en.ts` as always.

## Only what was filled in comes out

`buildJsonLd` places every non-empty value at its path, then `finalize` walks
the result and removes any object that holds no *typed* value. A select always
has a value, so it does not count: a Product with only its name typed does not
grow an `offers` object just because the currency dropdown reads JPY. Once a
sibling is typed, the select rides along. Objects that survive get their
declared `@type` stamped first.

Repeat fields (FAQ entries, breadcrumb items) are built row by row with the
same rule, blank rows are skipped, and `position` is numbered after skipping,
so a blank row in the middle of a breadcrumb never leaves a gap.

Numbers (`price`, `latitude`, `ratingValue`) are emitted as JSON numbers; input
that does not parse is dropped rather than emitted as a string, which the
validators would flag. Multi-line fields split on newlines, trim, and drop
blank lines. `availability` options are shown as words and emitted with the
`https://schema.org/` prefix.

## The script tag, and the one escape that matters

The output defaults to being wrapped in `<script type="application/ld+json">`
because that is what people paste. `<` is escaped to `\u003c` in the JSON, so a
value containing `</script>` cannot close the tag early — the same rule this
site's own `script:ld+json` output follows. JSON parsers read the escape back
as `<`, so nothing is lost.

## A comment names the block

The output opens with `<!-- 構造化データ: 記事（BlogPosting） -->` (EN
`<!-- Structured data: Article (BlogPosting) -->`) by default, so whoever
opens the template months later knows what the block is without reading the
JSON. It is an HTML comment and therefore only exists with the script tag;
turning the tag off greys the option out rather than emitting invalid JSON.
`--` inside the text is broken up so the comment cannot close itself early.

## Where to paste it

Each type carries a `placement` string (on each article page; on the homepage
only; on the page where the questions are visible), shown next to the code and
changing with the type. A general note covers `<head>` vs end of `<body>` and
the usual CMS locations. The guide is honest that Google has restricted the FAQ
rich result to government and health sites since 2023.

## Entries are remembered for 30 days

Everything typed is saved to `localStorage` under
`yoshinya:structured-data-generator:v1` with a timestamp, and restored on the
next visit if less than 30 days old — a company's address is the same next
month. `parseStored` rebuilds the values field by field against the current
schema, so a renamed field is simply blank and a stored value of the wrong
shape is ignored. Each type keeps its own entries, so switching from Article to
Product and back loses nothing; *Clear this form* resets only the current type.

## Privacy

Nothing typed is sent anywhere. The code is built in the browser; storage is
`localStorage` on the device. Analytics carry `tool_opened`, and on copy a
`batch_action` with `action: 'copy_code'` and `mode: <type id>` — a fixed
identifier, never a value. The e2e suite asserts no request leaves localhost
while typing and copying.

## Tests

- `lib/build.test.ts` — every type empties to context + type; nested typing
  and pruning; the select-alone rule; numbers and unparseable numbers;
  multi-line splitting; root type from a select; FAQ rows and breadcrumb
  numbering after skipping blanks; the `</script>` escape.
- `lib/values.test.ts` — defaults, immutable row edits, the last row cannot be
  removed, out-of-range moves are ignored.
- `lib/storage.test.ts` — round trip, expiry, garbage, wrong shapes, unknown
  types and options.
- `StructuredDataTool.test.tsx` — the form and code follow the chosen type,
  blanks stay out, entries survive switching, the script toggle, copy,
  restore, clear, and the Japanese page.
- `e2e/smoke.spec.ts` — article, local business, FAQ and breadcrumb flows,
  clipboard and reload, and no outbound requests; plus the shared page
  structure block.
