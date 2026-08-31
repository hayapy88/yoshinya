import type { IconDefinition } from './icon-data';
import type { IconStyle } from './style';

// Every lucide icon is drawn inside this box. Padding and the background are
// added around it rather than shrinking the icon, so the stroke keeps the
// weight the user asked for.
const ICON_VIEWBOX = 24;

// Roughly the squircle proportion an app icon uses. Expressed as a fraction of
// the canvas so it stays right whatever the padding.
const ROUNDED_RADIUS_RATIO = 0.22;

/**
 * Trims floating-point noise out of a coordinate. `32 * 0.22` is
 * 7.040000000000001, and shipping that inside markup the user is about to
 * paste into their own codebase makes the tool look careless.
 */
export function formatNumber(value: number): string {
  return String(Number(value.toFixed(3)));
}

function backgroundElement(style: IconStyle, canvas: number): string {
  const size = formatNumber(canvas);
  const fill = style.backgroundColor;
  if (style.background === 'circle') {
    const center = formatNumber(canvas / 2);
    return `  <circle cx="${center}" cy="${center}" r="${center}" fill="${fill}"/>\n`;
  }
  const radius =
    style.background === 'rounded'
      ? ` rx="${formatNumber(canvas * ROUNDED_RADIUS_RATIO)}"`
      : '';
  return `  <rect width="${size}" height="${size}"${radius} fill="${fill}"/>\n`;
}

/**
 * Builds the finished SVG for one icon.
 *
 * The output is indented rather than minified on purpose: its main destination
 * is the clipboard, and from there someone's own source file.
 *
 * Note that stroke width is a coordinate in the viewBox, not a pixel value, so
 * enlarging the icon thickens the line proportionally. That is what "make this
 * icon bigger" is expected to mean; keeping the stroke at a constant pixel
 * weight would quietly make large icons look like a different set.
 */
export function buildSvg(icon: IconDefinition, style: IconStyle): string {
  const hasBackground = style.background !== 'none';
  // Padding with no background would just be transparent margin the user
  // cannot see but every downstream layout has to deal with.
  const padding = hasBackground ? style.padding : 0;
  const canvas = ICON_VIEWBOX + padding * 2;
  const box = formatNumber(canvas);

  const offset = formatNumber(padding);
  const transform = padding > 0 ? ` transform="translate(${offset},${offset})"` : '';
  const drawing = icon.markup.replaceAll('/><', '/>\n    <');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${style.size}" height="${style.size}" viewBox="0 0 ${box} ${box}">\n` +
    (hasBackground ? backgroundElement(style, canvas) : '') +
    `  <g${transform} fill="none" stroke="${style.color}" stroke-width="${formatNumber(style.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round">\n` +
    `    ${drawing}\n` +
    `  </g>\n` +
    `</svg>\n`
  );
}
