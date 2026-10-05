import { contrastRatio, normalizeHex, relativeLuminance } from '~/lib/color';

/**
 * Whether a pair of colours can still be read as a QR code.
 *
 * A scanner looks for dark modules on a light field. Two conditions decide
 * whether it finds them, and neither is visible by eye on a screen — a code
 * that looks fine at 300px on a bright monitor can be unreadable on paper.
 */

export const DEFAULT_DARK = '#000000';
export const DEFAULT_LIGHT = '#ffffff';

/**
 * Below this, the two colours are too close for a camera working with a
 * shadow, a glare or a cheap print. The QR specification asks for at least
 * 40% reflectance difference; the WCAG ratio is the measure already used
 * elsewhere in this codebase, and 4:1 is the point where the two agree closely
 * enough to warn on.
 */
export const MIN_CONTRAST = 4;

export type ColorAssessment = {
  ratio: number;
  lowContrast: boolean;
  /** The "dark" colour is the lighter of the two: an inverted code. */
  inverted: boolean;
};

export function assessColors(dark: string, light: string): ColorAssessment {
  const ratio = contrastRatio(dark, light);
  return {
    ratio,
    lowContrast: ratio < MIN_CONTRAST,
    // Many scanners read an inverted code; enough of them do not that printing
    // one is a gamble, so it is called out separately from plain low contrast.
    inverted: relativeLuminance(dark) > relativeLuminance(light),
  };
}

/** A colour from an input field, or the default if it is not a colour at all. */
export function safeColor(value: string, fallback: string): string {
  return normalizeHex(value) ?? fallback;
}
