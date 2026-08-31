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
