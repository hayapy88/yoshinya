// Unifying full-width and half-width characters, one kind at a time.
//
// The usual converter has two buttons — "all full-width" and "all half-width" —
// and neither produces what Japanese web copy actually wants: half-width
// letters and digits, full-width katakana. So each kind of character gets its
// own direction, and the conversion reports what it changed so the result can
// be checked rather than trusted.

export type Direction = 'half' | 'full' | 'keep';

export type Category = 'alnum' | 'kana' | 'symbol' | 'space';

export const CATEGORIES: Category[] = ['alnum', 'kana', 'symbol', 'space'];

export const DIRECTIONS: Direction[] = ['half', 'full', 'keep'];

export type ConvertSettings = Record<Category, Direction> & {
  /** Characters to leave alone in either direction, typed as one string. */
  exclude: string;
};

export type Segment = { text: string; changed: boolean };

export type ConvertResult = {
  output: string;
  /** The output split into runs, so the changes can be highlighted. */
  segments: Segment[];
  /** How many characters of each kind were converted. */
  counts: Record<Category, number>;
};

// Full-width forms sit at a fixed distance from ASCII: U+FF01–FF5E mirror
// 0x21–0x7E.
const WIDTH_OFFSET = 0xfee0;

// U+FF61–FF9F in order: half-width kana punctuation, kana, then the two
// voicing marks.
const HALF_KANA_START = 0xff61;
const FULL_FOR_HALF_KANA =
  '。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン゛゜';

const HALF_DAKUTEN = 'ﾞ';
const HALF_HANDAKUTEN = 'ﾟ';

// What a base katakana becomes with a voicing mark. Listed rather than
// computed from code point offsets, because ウ, ワ and ヲ do not follow them.
const DAKUTEN: Record<string, string> = {
  カ: 'ガ',
  キ: 'ギ',
  ク: 'グ',
  ケ: 'ゲ',
  コ: 'ゴ',
  サ: 'ザ',
  シ: 'ジ',
  ス: 'ズ',
  セ: 'ゼ',
  ソ: 'ゾ',
  タ: 'ダ',
  チ: 'ヂ',
  ツ: 'ヅ',
  テ: 'デ',
  ト: 'ド',
  ハ: 'バ',
  ヒ: 'ビ',
  フ: 'ブ',
  ヘ: 'ベ',
  ホ: 'ボ',
  ウ: 'ヴ',
  ワ: 'ヷ',
  ヲ: 'ヺ',
};
const HANDAKUTEN: Record<string, string> = {
  ハ: 'パ',
  ヒ: 'ピ',
  フ: 'プ',
  ヘ: 'ペ',
  ホ: 'ポ',
};

// Full-width katakana to half-width. The punctuation at the front of the table
// is deliberately left out: 。「」、 are ordinary Japanese punctuation, and
// turning them into their half-width forms would wreck every sentence.
const HALF_FOR_FULL_KANA: Record<string, string> = {};
for (let i = 5; i < FULL_FOR_HALF_KANA.length; i += 1) {
  HALF_FOR_FULL_KANA[FULL_FOR_HALF_KANA[i]] = String.fromCharCode(
    HALF_KANA_START + i,
  );
}
for (const [base, voiced] of Object.entries(DAKUTEN)) {
  HALF_FOR_FULL_KANA[voiced] = HALF_FOR_FULL_KANA[base] + HALF_DAKUTEN;
}
for (const [base, voiced] of Object.entries(HANDAKUTEN)) {
  HALF_FOR_FULL_KANA[voiced] = HALF_FOR_FULL_KANA[base] + HALF_HANDAKUTEN;
}

const PROLONGED = 'ー';

// Addresses are protected whole. Converting either one to full-width breaks
// it, and a text that mentions a URL usually means it to keep working. The
// character classes stop at the first non-ASCII character, so the Japanese
// that follows an address without a space is not swallowed into it.
const PROTECTED =
  /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

function isAsciiAlnum(code: number): boolean {
  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a)
  );
}

function isKatakana(char: string | undefined): boolean {
  if (!char) {
    return false;
  }
  const code = char.charCodeAt(0);
  return (
    (code >= 0x30a1 && code <= 0x30fa) ||
    code === 0x30fc ||
    (code >= 0xff66 && code <= 0xff9d)
  );
}

function protectedRanges(text: string): boolean[] {
  const mask = new Array<boolean>(text.length).fill(false);
  for (const match of text.matchAll(PROTECTED)) {
    const start = match.index ?? 0;
    // A sentence-ending full stop is not part of the address.
    const length = match[0].replace(/[.,]+$/, '').length;
    mask.fill(true, start, start + length);
  }
  return mask;
}

type Step = { consumed: number; result: string; category: Category } | null;

/** What the character at `index` would become, before exclusions. */
function step(text: string, index: number, settings: ConvertSettings): Step {
  const char = text[index];
  const code = char.charCodeAt(0);

  // Half-width kana, joined with a following voicing mark where one fits.
  if (code >= HALF_KANA_START && code <= 0xff9f) {
    if (settings.kana !== 'full') {
      return null;
    }
    const full = FULL_FOR_HALF_KANA[code - HALF_KANA_START];
    const next = text[index + 1];
    const voiced =
      next === HALF_DAKUTEN
        ? DAKUTEN[full]
        : next === HALF_HANDAKUTEN
          ? HANDAKUTEN[full]
          : undefined;
    if (voiced) {
      return { consumed: 2, result: voiced, category: 'kana' };
    }
    return { consumed: 1, result: full, category: 'kana' };
  }

  if (settings.kana === 'half') {
    // ー after hiragana or a kanji is part of that word (らーめん), and has no
    // business turning into ｰ. Only after katakana is it kana.
    if (char === PROLONGED) {
      return isKatakana(text[index - 1])
        ? { consumed: 1, result: HALF_FOR_FULL_KANA[char], category: 'kana' }
        : null;
    }
    const half = HALF_FOR_FULL_KANA[char];
    if (half) {
      return { consumed: 1, result: half, category: 'kana' };
    }
  }

  if (code >= 0xff01 && code <= 0xff5e) {
    const ascii = code - WIDTH_OFFSET;
    const category = isAsciiAlnum(ascii) ? 'alnum' : 'symbol';
    return settings[category] === 'half'
      ? { consumed: 1, result: String.fromCharCode(ascii), category }
      : null;
  }

  if (code >= 0x21 && code <= 0x7e) {
    const category = isAsciiAlnum(code) ? 'alnum' : 'symbol';
    return settings[category] === 'full'
      ? {
          consumed: 1,
          result: String.fromCharCode(code + WIDTH_OFFSET),
          category,
        }
      : null;
  }

  if (code === 0x3000 && settings.space === 'half') {
    return { consumed: 1, result: ' ', category: 'space' };
  }
  if (code === 0x20 && settings.space === 'full') {
    return { consumed: 1, result: '　', category: 'space' };
  }

  return null;
}

/**
 * The characters the person asked to leave alone. Whitespace is ignored, so a
 * stray space in the field cannot silently switch off the space setting — that
 * has its own control.
 */
export function excludedCharacters(exclude: string): Set<string> {
  return new Set([...exclude].filter((char) => !/\s/.test(char)));
}

export function convertText(
  text: string,
  settings: ConvertSettings,
): ConvertResult {
  const counts: Record<Category, number> = {
    alnum: 0,
    kana: 0,
    symbol: 0,
    space: 0,
  };
  const segments: Segment[] = [];
  const excluded = excludedCharacters(settings.exclude);
  const isProtected = protectedRanges(text);

  const push = (piece: string, changed: boolean) => {
    const last = segments.at(-1);
    if (last && last.changed === changed) {
      last.text += piece;
    } else {
      segments.push({ text: piece, changed });
    }
  };

  let index = 0;
  while (index < text.length) {
    const next = isProtected[index] ? null : step(text, index, settings);
    if (!next) {
      push(text[index], false);
      index += 1;
      continue;
    }
    const source = text.slice(index, index + next.consumed);
    // Listing a character stops conversion both to it and from it: putting （
    // in the field keeps （ as it is and also stops ( from becoming （. A kana
    // and its voicing mark stay together either way, or an excluded ｶﾞ would
    // come out as ｶ゛.
    if (excluded.has(source[0]) || excluded.has(next.result)) {
      push(source, false);
    } else {
      push(next.result, true);
      counts[next.category] += 1;
    }
    index += next.consumed;
  }

  return {
    output: segments.map((segment) => segment.text).join(''),
    segments,
    counts,
  };
}
