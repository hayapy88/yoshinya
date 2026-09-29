# Character Counter (よしにゃに文字数カウント)

Week 11. Counts text the way the person reading it counts it, and checks the
result against the limits people are actually writing to. Everything runs in
the browser: `/ja/character-counter` and `/en/character-counter`.

## Problem being solved

Character counters are the most crowded category this site has entered, and
most of the free ones display `text.length`. That number is wrong in ways that
matter the moment a post contains an emoji, and it answers a different question
from the one the writer has: not "how many units is this" but "does it fit".

Concrete jobs it kills:

- Trimming an X post where Japanese, ASCII and emoji each cost something
  different.
- Writing a title or meta description to a length that survives the search
  result.
- Turning an essay into manuscript pages for a submission.
- Filling a form with a strict character limit that may or may not count
  spaces.

## Why enter a crowded category at all

Not on tool count — on correctness. Three of the four things this tool does,
the popular free counters get wrong or do not do:

1. `'👨‍👩‍👧'.length` is 8, and counters that report UTF-16 units say 8.
2. X's limit is not a character count, it is a weighted length, and "140 or
   280?" is a real question for mixed text.
3. Manuscript pages are not `characters / 400`, because every line break moves
   to a new row.

Those are the SEO wedge as well: `絵文字 文字数 数え方`, `x 文字数 カウント`,
`原稿用紙 何枚 計算` are queries the generic counters do not answer.

## Naming

JA `よしにゃに文字数カウント`, EN `Character Counter by Yoshinya`. The JA title
leads with `原稿用紙・SNSの字数制限` — the tool name already carries 文字数, so
the leading phrase spends its space on the other query cluster.

## Everything is built on grapheme clusters

`graphemes()` wraps `Intl.Segmenter` with `granularity: 'grapheme'`, and every
count above it is defined in those terms. A family emoji, a skin-tone modifier,
a flag and a combining dakuten are each one character, because that is what the
writer sees. Without a Segmenter the fallback is `[...text]`, which is code
points — a surrogate pair stays whole and only ZWJ sequences come apart, so the
tool degrades rather than breaking.

The Segmenters are constructed once at module level. Building one per keystroke
is the only thing in this file slow enough to notice on a long document.

`\r\n` is normalized to `\n` before anything is counted, or a pasted Windows
document reports one extra character per line and twice the line breaks.

## The X count implements twitter-text, not an approximation

`weightedLength()` follows X's published v3 configuration: code points in
`0x0000–0x10FF`, `0x2000–0x200D`, `0x2010–0x201F`, `0x2032–0x2037` and `0x203E`
weigh 1, everything else weighs 2, and the limit is 280. A whole emoji weighs 2
however many code points it holds, matching X's `emojiParsingEnabled`. So 140
Japanese characters and 280 ASCII ones both come to exactly 280, and the number
here matches the compose box.

One deliberate gap: X shortens every URL to 23 characters and this tool counts
the URL as typed. A post with links therefore has *more* room than the tool
suggests, which is the safe direction to be wrong in. The guide and the FAQ
both say so.

## Manuscript pages are counted row by row

Japanese manuscript paper is 20 columns by 20 rows and every line break moves
to a new row, full or not. `manuscript()` charges each line
`max(1, ceil(length / 20))` rows — the `max` is what gives an empty line its
row — then divides the total by 20 for the sheet count. Both numbers are shown,
because the row count is what explains a sheet count that dividing by 400 would
not predict: 100 single-character lines are 100 characters but 100 rows, so
five sheets rather than one.

## Limits name the count that decides them

`targets.ts` pairs each limit with a `measure`, because "280" and "120" are not
the same units:

| Target | Limit | Measured by |
| --- | --- | --- |
| X post | 280 | weighted length |
| Title tag | 30 | full-width equivalents |
| Meta description | 120 | full-width equivalents |
| YouTube description | 5000 | characters |
| Instagram caption | 2200 | characters |

Full-width equivalence counts a wide character as 1 and a narrow one as 0.5,
which is how Japanese limits have always been quoted, and the halves are kept
rather than rounded — 61 narrow characters reads as `30.5 / 30`, over the
limit, rather than silently becoming 30 or 31.

The title and description limits are conventions standing in for a pixel-width
cut-off, and the hint above the list plus the FAQ both say so rather than
presenting them as rules. Going over is never prevented: the card turns red and
the tool keeps counting.

## Nothing is stored, deliberately

This is the one tool that does not use `localStorage`. Every other tool here
remembers settings, and the "覚えている" principle would suggest remembering the
text too — but what gets pasted here is the user's own unpublished writing, and
leaving it on a shared computer costs more than retyping. The guide says so
explicitly, since the absence is a feature and would otherwise read as an
oversight. The e2e suite asserts that nothing containing the typed text is in
`localStorage` and that a reload comes back empty.

`tool_opened` fires on the first keystroke rather than on mount, so the metric
counts people using the tool rather than crawlers loading the page.

## Tests

- `lib/count.test.ts` — grapheme clusters for ZWJ emoji, skin tones, flags and
  combining marks; whitespace exclusion; CRLF; lines vs paragraphs; Japanese
  word segmentation; the weighted length cases (140 Japanese = 280, 280 ASCII =
  280, one emoji = 2); manuscript rows, empty lines, and the case where
  dividing by 400 gives the wrong answer.
- `lib/targets.test.ts` — each measure, exactly at the limit, over it, the kept
  half, and the bar held at 1.
- `CharacterCounterTool.test.tsx` — counting as you type, emoji as one, the
  detail rows, thousands separators, over-limit flagging, clear, copy, and the
  Japanese page.
- `e2e/smoke.spec.ts` — the counting flows in Japanese, the over-limit card,
  clear, and the privacy assertions (no outbound request, nothing stored,
  nothing after a reload); plus the shared page structure block.
