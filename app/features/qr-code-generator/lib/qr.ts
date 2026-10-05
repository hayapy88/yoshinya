import qrcode from 'qrcode-generator';
import { logoBox } from './logo';
import { escapeXml, TEXT_FONT_STACK, textLayout } from './text';

/**
 * Turns a payload into a module matrix, and the matrix into SVG or canvas
 * pixels.
 *
 * The library is used only for the encoding; the drawing is done here, because
 * both outputs need control the built-in renderers do not give: an exact pixel
 * size for the PNG and a single path for the SVG.
 */

export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export const ERROR_CORRECTIONS: ErrorCorrection[] = ['L', 'M', 'Q', 'H'];

export const SIZE_MIN = 128;
export const SIZE_MAX = 2048;
export const DEFAULT_SIZE = 512;
export const MARGIN_MIN = 0;
export const MARGIN_MAX = 8;
/** Four modules is the quiet zone the QR specification asks for. */
export const DEFAULT_MARGIN = 4;
export const DEFAULT_ERROR_CORRECTION: ErrorCorrection = 'M';

/** The input does not fit in a QR code at this error-correction level. */
export class QrCapacityError extends Error {
  constructor() {
    super('The text is too long to fit in a QR code');
    this.name = 'QrCapacityError';
  }
}

export type QrMatrix = {
  /** Modules per side, excluding the quiet zone. */
  count: number;
  dark: boolean[][];
};

const UTF8 = new TextEncoder();

/**
 * The payload as one character per UTF-8 byte.
 *
 * Japanese payloads are the normal case here, and the library's own byte
 * encoder keeps only the low byte of each character — a Japanese SSID or vCard
 * would encode as mojibake that scans perfectly and shows the wrong text. The
 * library ships a UTF-8 encoder, but only on its global build; its ES module
 * does not export one. Since the default encoder masks to `& 0xff`, handing it
 * a string whose characters are already the UTF-8 bytes round-trips exactly,
 * with no global to mutate.
 */
function toByteString(text: string): string {
  let out = '';
  for (const byte of UTF8.encode(text)) {
    out += String.fromCharCode(byte);
  }
  return out;
}

export function buildMatrix(
  text: string,
  errorCorrection: ErrorCorrection,
): QrMatrix {
  let code;
  try {
    // Type number 0 lets the library pick the smallest version that fits.
    code = qrcode(0, errorCorrection);
    code.addData(toByteString(text));
    code.make();
  } catch {
    // Over-capacity input is thrown as a bare value with no message, so there
    // is nothing to inspect and nothing else reaches here.
    throw new QrCapacityError();
  }
  const count = code.getModuleCount();
  const dark: boolean[][] = [];
  for (let row = 0; row < count; row += 1) {
    const line: boolean[] = [];
    for (let column = 0; column < count; column += 1) {
      line.push(code.isDark(row, column));
    }
    dark.push(line);
  }
  return { count, dark };
}

/**
 * The pixel size a PNG export actually gets.
 *
 * Modules have to land on whole pixels. At a fractional scale the renderer
 * spreads the rounding unevenly — some modules a pixel wider than their
 * neighbours — and a code printed small enough stops being read reliably. So
 * the requested size is rounded down to the nearest whole multiple, and the
 * real number is shown to the user rather than quietly differing from it.
 */
export function exportSize(
  matrix: QrMatrix,
  margin: number,
  requested: number,
): { scale: number; size: number } {
  const side = matrix.count + margin * 2;
  const scale = Math.max(1, Math.floor(requested / side));
  return { scale, size: scale * side };
}

export type LogoOptions = {
  /** A `data:image/…` URL. Anything else is ignored rather than embedded. */
  href: string;
  ratio: number;
};

export type TextOptions = {
  value: string;
  color: string;
  /** Font size as a share of the code's width. */
  ratio: number;
};

export type RenderOptions = {
  margin: number;
  dark?: string;
  light?: string;
  /** The middle of the code holds a logo, a word, or nothing. */
  logo?: LogoOptions | null;
  text?: TextOptions | null;
};

/**
 * Only a data URL for an image is ever written into the markup.
 *
 * The SVG is handed to a download and to an <img>; a URL of any other kind in
 * there would be a request leaving the page, which is the one thing this tool
 * promises never to do.
 */
export function isEmbeddableLogo(href: string): boolean {
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(href);
}

/**
 * One `<path>` for every dark module, drawn as a run of horizontal segments.
 *
 * Hundreds of separate `<rect>` elements render with hairline seams between
 * neighbours in several PDF and print pipelines — the white lines show up as
 * scan failures at small sizes. A single filled path has no seams.
 */
export function renderSvg(matrix: QrMatrix, options: RenderOptions): string {
  const { margin, dark = '#000000', light = '#ffffff' } = options;
  const side = matrix.count + margin * 2;
  const segments: string[] = [];
  for (let row = 0; row < matrix.count; row += 1) {
    let run = 0;
    for (let column = 0; column <= matrix.count; column += 1) {
      const filled = column < matrix.count && matrix.dark[row][column];
      if (filled) {
        run += 1;
        continue;
      }
      if (run > 0) {
        segments.push(
          `M${column - run + margin} ${row + margin}h${run}v1h-${run}z`,
        );
        run = 0;
      }
    }
  }
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${side}" height="${side}" shape-rendering="crispEdges">`,
    `<rect width="${side}" height="${side}" fill="${light}"/>`,
    `<path fill="${dark}" d="${segments.join('')}"/>`,
  ];
  if (options.text) {
    const layout = textLayout(
      matrix.count,
      margin,
      options.text.value,
      options.text.ratio,
    );
    if (layout) {
      parts.push(
        `<rect x="${layout.x}" y="${layout.y}" width="${layout.width}" height="${layout.height}" fill="${light}"/>`,
        `<text x="${layout.centerX}" y="${layout.centerY}" fill="${options.text.color}" font-family="${TEXT_FONT_STACK}" font-size="${layout.fontSize}" font-weight="700" text-anchor="middle" dominant-baseline="central">${escapeXml(options.text.value.trim())}</text>`,
      );
    }
  }
  if (options.logo && isEmbeddableLogo(options.logo.href)) {
    const box = logoBox(matrix.count, margin, options.logo.ratio);
    parts.push(
      `<rect x="${box.backingX}" y="${box.backingY}" width="${box.backingSize}" height="${box.backingSize}" fill="${light}"/>`,
      `<image x="${box.x}" y="${box.y}" width="${box.size}" height="${box.size}" preserveAspectRatio="xMidYMid meet" href="${options.logo.href}"/>`,
    );
  }
  parts.push('</svg>');
  return parts.join('');
}

/** Draws the matrix onto a canvas context at a whole-pixel scale. */
export function drawMatrix(
  context: CanvasRenderingContext2D,
  matrix: QrMatrix,
  scale: number,
  margin: number,
  colors: { dark?: string; light?: string } = {},
): void {
  const { dark = '#000000', light = '#ffffff' } = colors;
  const side = (matrix.count + margin * 2) * scale;
  context.fillStyle = light;
  context.fillRect(0, 0, side, side);
  context.fillStyle = dark;
  for (let row = 0; row < matrix.count; row += 1) {
    for (let column = 0; column < matrix.count; column += 1) {
      if (matrix.dark[row][column]) {
        context.fillRect(
          (column + margin) * scale,
          (row + margin) * scale,
          scale,
          scale,
        );
      }
    }
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
