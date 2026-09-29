// Counting text the way the person looking at it counts it.
//
// The naive version of this tool is `text.length`, which is wrong in ways that
// matter: '👨‍👩‍👧'.length is 8, and a Windows line break counts twice. Every
// count here is built on grapheme clusters — what a reader calls "a character".

export type Counts = {
  /** Grapheme clusters, including spaces and line breaks. */
  characters: number;
  /** The same, with every kind of whitespace removed. */
  charactersNoWhitespace: number;
  words: number;
  lines: number;
  paragraphs: number;
  /** Characters that occupy two columns in a monospaced Japanese font. */
  fullWidth: number;
  halfWidth: number;
  /** X's weighted length: Japanese counts 2, ASCII 1, one emoji 2. */
  weighted: number;
  utf8Bytes: number;
  manuscript: { sheets: number; rows: number };
};

const MANUSCRIPT_COLUMNS = 20;
const MANUSCRIPT_ROWS = 20;

// Built once: constructing a Segmenter per keystroke is the one thing in this
// file slow enough to notice on a long document.
const graphemeSegmenter = makeSegmenter('grapheme');
// Japanese needs a dictionary to find word boundaries at all, and the ja
// segmenter splits Latin text on whitespace just as an English one would.
const wordSegmenter = makeSegmenter('word', 'ja');

function makeSegmenter(
  granularity: 'grapheme' | 'word',
  locale?: string,
): Intl.Segmenter | null {
  // Present everywhere the site runs, but a polyfill-free older browser would
  // otherwise take the whole page down rather than lose one count.
  if (typeof Intl === 'undefined' || !('Segmenter' in Intl)) {
    return null;
  }
  try {
    return new Intl.Segmenter(locale, { granularity });
  } catch {
    return null;
  }
}

/**
 * Splits into what a reader would call characters: an emoji built from several
 * code points, or a letter followed by a combining mark, is one entry.
 *
 * Falls back to code points, which is still better than UTF-16 units — a
 * surrogate pair stays whole, only ZWJ sequences come apart.
 */
export function graphemes(text: string): string[] {
  if (!graphemeSegmenter) {
    return [...text];
  }
  return Array.from(graphemeSegmenter.segment(text), (entry) => entry.segment);
}

// Ranges that take two columns: the CJK blocks, Hangul, kana, fullwidth forms.
// Matched per code point, so a character outside the BMP is judged as one unit.
const WIDE = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︐-︙︰-﹯＀-｠￠-￦]/;

function isWide(grapheme: string): boolean {
  // An emoji is drawn at full width whatever its code points say.
  return WIDE.test(grapheme) || isEmoji(grapheme);
}

const EMOJI = /\p{Extended_Pictographic}/u;

function isEmoji(grapheme: string): boolean {
  return EMOJI.test(grapheme);
}

/**
 * X's weighted length, following twitter-text's v3 configuration: code points
 * in the ranges below weigh 1, everything else weighs 2, and a whole emoji —
 * including a ZWJ sequence like 👨‍👩‍👧 — weighs 2 rather than 2 per part.
 *
 * So 140 Japanese characters and 280 ASCII ones both come to the 280 limit.
 */
export function weightedLength(text: string): number {
  let total = 0;
  for (const grapheme of graphemes(text)) {
    if (isEmoji(grapheme)) {
      total += 2;
      continue;
    }
    for (const char of grapheme) {
      const code = char.codePointAt(0) ?? 0;
      total += isLightCodePoint(code) ? 1 : 2;
    }
  }
  return total;
}

function isLightCodePoint(code: number): boolean {
  return (
    code <= 0x10ff ||
    (code >= 0x2000 && code <= 0x200d) ||
    (code >= 0x2010 && code <= 0x201f) ||
    (code >= 0x2032 && code <= 0x2037) ||
    code === 0x203e
  );
}

/**
 * Manuscript paper, counted the way it is actually written on: 20 columns by
 * 20 rows, with every line break moving to a new row. Dialogue-heavy text
 * therefore needs more sheets than dividing by 400 suggests.
 */
export function manuscript(lines: string[]): { sheets: number; rows: number } {
  const rows = lines.reduce((total, line) => {
    const length = graphemes(line).length;
    // An empty line still occupies its row.
    return total + Math.max(1, Math.ceil(length / MANUSCRIPT_COLUMNS));
  }, 0);
  return { sheets: Math.ceil(rows / MANUSCRIPT_ROWS), rows };
}

function countWords(text: string): number {
  if (text.trim() === '') {
    return 0;
  }
  if (!wordSegmenter) {
    // Latin words by whitespace, plus one per CJK character, which is what the
    // segmenter approximates anyway.
    const latin = text
      .replace(/[　-鿿豈-﫿＀-ﾟ]/g, ' ')
      .split(/\s+/)
      .filter((word) => word !== '').length;
    const cjk = (text.match(/[぀-鿿豈-﫿]/g) ?? []).length;
    return latin + cjk;
  }
  let words = 0;
  for (const entry of wordSegmenter.segment(text)) {
    if (entry.isWordLike) {
      words += 1;
    }
  }
  return words;
}

/** Counts every measure the tool shows, in one pass over the text. */
export function countText(text: string): Counts {
  // A pasted Windows document would otherwise count each break twice and add a
  // stray character to every line.
  const normalized = text.replace(/\r\n?/g, '\n');

  if (normalized === '') {
    return {
      characters: 0,
      charactersNoWhitespace: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
      fullWidth: 0,
      halfWidth: 0,
      weighted: 0,
      utf8Bytes: 0,
      manuscript: { sheets: 0, rows: 0 },
    };
  }

  const units = graphemes(normalized);
  let charactersNoWhitespace = 0;
  let fullWidth = 0;
  let halfWidth = 0;
  for (const unit of units) {
    if (/^\s$/u.test(unit)) {
      continue;
    }
    charactersNoWhitespace += 1;
    if (isWide(unit)) {
      fullWidth += 1;
    } else {
      halfWidth += 1;
    }
  }

  const lines = normalized.split('\n');
  const paragraphs = normalized
    .split(/\n\s*\n/)
    .filter((block) => block.trim() !== '').length;

  return {
    characters: units.length,
    charactersNoWhitespace,
    words: countWords(normalized),
    lines: lines.length,
    paragraphs,
    fullWidth,
    halfWidth,
    weighted: weightedLength(normalized),
    utf8Bytes: new TextEncoder().encode(normalized).length,
    manuscript: manuscript(lines),
  };
}
