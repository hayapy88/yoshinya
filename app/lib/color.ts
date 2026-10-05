/**
 * Turns whatever is in a colour field into a `#rrggbb` string, or null if it is
 * not a colour at all.
 *
 * This is the only way a colour reaches the SVG builder. Writing the raw field
 * value into a `stroke="…"` attribute would let a typed quote character break
 * out of the attribute, and the generated SVG is handed to the clipboard, to a
 * download, and to an <img> for rasterising — three places where malformed
 * markup fails in three different ways.
 */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '');
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
    return null;
  }
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : raw;
  return `#${full.toLowerCase()}`;
}

/**
 * Relative luminance per WCAG, from a `#rrggbb` string.
 *
 * Used to judge whether two colours are far enough apart to be told apart —
 * by a person reading a page, or by a scanner reading a QR code.
 */
export function relativeLuminance(hex: string): number {
  const value = normalizeHex(hex) ?? '#000000';
  const channels = [1, 3, 5].map((start) => {
    const srgb = parseInt(value.slice(start, start + 2), 16) / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** The WCAG contrast ratio between two colours: 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
