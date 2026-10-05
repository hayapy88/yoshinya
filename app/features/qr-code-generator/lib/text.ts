/**
 * Laying a short word over the middle of a QR code.
 *
 * Like a logo, the text overwrites modules that the scanner then rebuilds from
 * the error-correction data, so the same question decides everything here: how
 * much of the code is being covered. A word is a wide, short band rather than
 * a square, which is why it gets its own limits instead of the logo's.
 */

/** Font size, as a share of the code's width. */
export const TEXT_RATIO_MIN = 0.04;
export const TEXT_RATIO_MAX = 0.12;
export const TEXT_RATIO_DEFAULT = 0.08;

/**
 * The widest band the text may occupy, panel and padding included.
 *
 * Measured rather than reasoned about: with a 12%-tall band over a 29-module
 * code at level H, a decoder reads the result at 60% and fails at 64%. The cap
 * is 55%, a margin inside the point where it breaks, because a printed code
 * also has to survive the creases and glare a test image never sees.
 *
 * It applies to the panel, not to the glyphs. Capping the text alone and then
 * adding the padding around it is exactly how a band that was meant to stop at
 * 60% ended up covering 64% — the version of this that shipped nothing but a
 * nice-looking example a scanner could not read.
 */
export const TEXT_MAX_WIDTH_RATIO = 0.55;

/** A module of background on each side of the word, as under a logo. */
const PANEL_PADDING = 2;

export const TEXT_MAX_LENGTH = 24;

/**
 * Width of a string in em units, estimated rather than measured.
 *
 * Measuring would mean a canvas, and a canvas measurement would be available
 * when drawing the PNG but not when building the SVG — the two outputs would
 * then disagree about where the backing panel ends. One estimate used by both
 * keeps them identical, and the figures below are close enough for a word at
 * this size: full-width Japanese occupies a square em, Latin letters a little
 * over half of one.
 */
export function estimateEmWidth(text: string): number {
  let width = 0;
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    if (code > 0x1100 && !(code >= 0x2000 && code <= 0x206f)) {
      // CJK, kana, full-width forms and emoji: a full em each.
      width += 1;
    } else if (/[A-Za-z0-9@#%&]/.test(character)) {
      width += 0.6;
    } else {
      // Spaces, punctuation and the narrow Latin letters.
      width += 0.35;
    }
  }
  return width;
}

export type TextLayout = {
  /** Font size in module units. */
  fontSize: number;
  /** The backing panel, in module units, including the quiet zone offset. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Where the text is centred. */
  centerX: number;
  centerY: number;
};

/**
 * Where the word sits and how big it is allowed to be.
 *
 * The requested size is honoured until the word would run past the band, at
 * which point the font shrinks rather than the band growing: a code with a
 * stripe across it stops being a code.
 */
export function textLayout(
  count: number,
  margin: number,
  text: string,
  ratio: number,
): TextLayout | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const requested = Math.min(TEXT_RATIO_MAX, Math.max(TEXT_RATIO_MIN, ratio));
  const em = estimateEmWidth(trimmed.slice(0, TEXT_MAX_LENGTH));
  // The cap is on the finished panel, so the padding comes off the top before
  // the font is allowed to use what is left.
  const maxText = Math.max(
    count * TEXT_MAX_WIDTH_RATIO - PANEL_PADDING,
    count * TEXT_RATIO_MIN,
  );
  const fontSize = Math.min(count * requested, maxText / Math.max(em, 0.001));

  const width = em * fontSize + PANEL_PADDING;
  const height = fontSize + PANEL_PADDING;
  const centerX = margin + count / 2;
  const centerY = margin + count / 2;
  return {
    fontSize,
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    centerX,
    centerY,
  };
}

/** `&`, `<` and `>` would otherwise end the element early in the saved SVG. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * The same stack for the SVG and the canvas, so the PNG and the vector file
 * agree about the shape of the word wherever both are opened.
 */
export const TEXT_FONT_STACK =
  "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif";
