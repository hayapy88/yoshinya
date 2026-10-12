# Full/Half-Width Converter (よしにゃに全角半角変換)

Week 13. Unifies full-width and half-width characters in pasted text, with a
separate direction for letters and digits, katakana, symbols and spaces, and
highlights every character it changed. Everything runs in the browser:
`/ja/width-converter` and `/en/width-converter`.

## Where it came from

A client asked for a site redesign and said the existing copy could be reused
as it was — but it had drifted over the years, and they wanted the notation
unified while we were at it. The copy mixed ＡＢＣ and ABC, １２３ and 123, and
ｶﾀｶﾅ and カタカナ across many pages. Finding them by eye does not scale, and a
find-and-replace needs one pass per character.

The roadmap had this job at Week 26 as part of a larger "表記ゆれ統一" tool. The
width half of it is self-contained and light, so it ships now; word-level
unification (サーバ / サーバー) stays with the later tool.

## Problem being solved

- Reused copy with mixed widths has to be fixed character by character.
- The common converters offer "all full-width" or "all half-width", and neither
  produces the house style Japanese web copy actually uses: half-width letters
  and digits, full-width katakana.
- After converting, nothing says what changed, so the whole text has to be
  reread anyway.
- Converting everything to full-width breaks URLs and email addresses in the
  text.

## Naming

JA `よしにゃに全角半角変換`, EN `Full/Half-Width Converter by Yoshinya`. The JA
title leads with `表記ゆれを一括で統一` — the tool name already carries
全角半角変換, so the leading phrase spends its space on the job people describe
rather than the mechanism. The EN title leads with `Unify Zenkaku and Hankaku
Text`, because the people searching for this in English are mostly the ones
who already know those words.

## One direction per kind of character

`convertText()` in `lib/convert.ts` walks the text once and classifies each
character:

| Kind | Half-width | Full-width |
| --- | --- | --- |
| Letters and digits | `0-9 A-Z a-z` | U+FF10–FF19, FF21–FF3A, FF41–FF5A |
| Symbols | the rest of ASCII 0x21–0x7E | the rest of U+FF01–FF5E |
| Spaces | U+0020 | U+3000 |
| Katakana | U+FF61–FF9F | ァ–ヺ, ー, ゛゜, and 。「」、・ when widening |

Letters, digits and symbols sit at a fixed offset (0xFEE0) from ASCII, so that
part is arithmetic. Katakana is a table, because half-width kana are not in
the same order as the full-width block.

Defaults: letters and digits half-width, katakana full-width, symbols and
spaces left alone. Which way （） and ！ should go is a style choice, and
guessing it would change text nobody asked to change.

Not `String.prototype.normalize('NFKC')`. NFKC gets the easy cases right but
turns a standalone ﾞ into a *combining* mark that attaches to whatever comes
before it, converts characters this tool has no business touching (①, ㈱, ｍ²),
and only goes one way.

## Kana traps

- **Voicing marks join.** ｶﾞ is two characters; the full-width form is one, ガ.
  The kana is converted together with a following ﾞ or ﾟ when the pair has a
  composed form (including ｳﾞ→ヴ, ﾜﾞ→ヷ, ｦﾞ→ヺ). A mark that fits nothing
  becomes the standalone ゛ or ゜. Going half-width splits them again. The
  pair counts as one change.
- **Japanese punctuation stays full-width.** Half-width ｡｢｣､･ are widened, but
  narrowing katakana leaves 。「」、・ alone — turning them half-width would
  wreck every sentence.
- **ー only after katakana.** When narrowing, ー becomes ｰ only if the
  character before it is katakana. ー after hiragana is part of that word
  (らーめん).
- **Kana with no half-width form** (ヮ ヰ ヱ ヵ ヶ) are left as they are.

## Addresses are protected

URLs (`http`/`https`) and email addresses in half-width are matched up front
and their characters skipped, so widening everything cannot break a link. The
URL character class stops at the first non-ASCII character, so Japanese
written straight after an address is not swallowed into it, and a trailing
`.` or `,` is treated as sentence punctuation rather than part of the address.

Only half-width addresses are matched. A full-width ｈｔｔｐｓ：／／… is
converted like any other text, which is what makes it usable again.

## Characters to leave alone

A free-text field lists characters that are not converted in either direction:
listing （ keeps （ as it is *and* stops ( from becoming （. The usual case is
"symbols half-width, but keep （）！？ full-width". Whitespace in the field is
ignored, so a stray space cannot silently override the Spaces setting. A kana
and its voicing mark are kept together when excluded, or an excluded ｶﾞ would
come out as ｶ゛.

## The result shows what changed

`convertText()` returns the output as runs of changed and unchanged text, and
the result box renders the changed runs as `<mark>`. Adjacent changes merge
into one run, so a long text produces a few hundred nodes rather than one per
character. The counts per kind are shown above the result; when nothing needs
converting, the tool says so rather than showing an identical copy.

The result is a read-only `region` (focusable, `white-space: pre-wrap`) rather
than a second textarea, because a textarea cannot highlight.

## Storage

The rules — four directions and the exclusion list — are stored under
`yoshinya:width-converter:v1` and parsed defensively; anything unrecognised
falls back to the default and the list is capped at 100 characters. The text
is never stored. Settings are read after mount, as in the QR Code Generator,
so the server-rendered HTML and the first client render agree.

## Privacy

The text never leaves the tab and is not saved. Analytics record
`tool_opened` on the first input and `batch_action` with
`action: 'copy_result'` — never the text, the exclusion list or the counts.

## Tests

- `lib/convert.test.ts` — each kind in both directions and `keep`, the full
  syllabary, voicing marks joined and split, standalone marks, punctuation,
  the ー rule, round trips, URL and email protection (including a trailing
  full stop), exclusions in both directions, per-kind counts and the run
  splitting.
- `lib/settings.test.ts` — defensive parsing, the exclusion cap, `isDefault`.
- `WidthConverterTool.test.tsx` — default conversion, highlighting, the
  no-changes message, a rule change being remembered without the text,
  exclusions, restore and reset, copy, Japanese rendering.
- `e2e/smoke.spec.ts` — the default conversion and highlights, a URL surviving
  all-full-width, and no outbound requests / text not stored / rules restored
  after a reload. Also in the shared page-structure check.

## Out of scope

- Converting files (.txt, .csv) directly.
- Case, hiragana ⇔ katakana, and word-level unification — the later 表記ゆれ
  統一 tool.
- U+FFE0–FFE6 (￠￡￢￣￤￥￦).
