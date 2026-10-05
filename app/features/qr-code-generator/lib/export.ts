import { drawMatrix, isEmbeddableLogo, type LogoOptions, type QrMatrix } from './qr';
import { logoBox } from './logo';
import { TEXT_FONT_STACK, textLayout } from './text';
import type { TextOptions } from './qr';

/**
 * Rasterises a matrix at a whole-pixel scale.
 *
 * The canvas is drawn from the matrix directly rather than from the SVG: there
 * is no image to decode, nothing can taint the canvas, and the modules land
 * exactly where `exportSize` promised they would.
 */
export async function matrixToPngBlob(
  matrix: QrMatrix,
  scale: number,
  margin: number,
  colors: { dark?: string; light?: string } = {},
  logo?: LogoOptions | null,
  text?: TextOptions | null,
): Promise<Blob> {
  const side = (matrix.count + margin * 2) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is unavailable');
  }
  drawMatrix(context, matrix, scale, margin, colors);
  if (text) {
    drawText(context, matrix, scale, margin, text, colors.light);
  }
  if (logo && isEmbeddableLogo(logo.href)) {
    await drawLogo(context, matrix, scale, margin, logo, colors.light);
  }
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('The PNG could not be created'));
      }
    }, 'image/png');
  });
}

export function svgBlob(svg: string): Blob {
  return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
}

export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Paints the backing panel and the logo over the drawn modules.
 *
 * The image is a data URL, so the canvas is never tainted and `toBlob` stays
 * legal — the same reason the SVG embeds one rather than referencing a file.
 */
async function drawLogo(
  context: CanvasRenderingContext2D,
  matrix: QrMatrix,
  scale: number,
  margin: number,
  logo: LogoOptions,
  light = '#ffffff',
): Promise<void> {
  const box = logoBox(matrix.count, margin, logo.ratio);
  const image = new Image();
  image.src = logo.href;
  await image.decode();
  context.fillStyle = light;
  context.fillRect(
    box.backingX * scale,
    box.backingY * scale,
    box.backingSize * scale,
    box.backingSize * scale,
  );
  // Contained rather than stretched: a wide logo squashed into a square is
  // worse than a smaller one, and the box is the part that must not grow.
  const side = box.size * scale;
  const fit = Math.min(side / image.width, side / image.height);
  const width = image.width * fit;
  const height = image.height * fit;
  context.drawImage(
    image,
    box.x * scale + (side - width) / 2,
    box.y * scale + (side - height) / 2,
    width,
    height,
  );
}

/**
 * Paints the backing panel and the word over the drawn modules.
 *
 * The layout comes from the same function the SVG uses, rather than from the
 * canvas's own text measurement: the two outputs have to agree about where the
 * panel ends, and only one of them has a canvas to ask.
 */
function drawText(
  context: CanvasRenderingContext2D,
  matrix: QrMatrix,
  scale: number,
  margin: number,
  text: TextOptions,
  light = '#ffffff',
): void {
  const layout = textLayout(matrix.count, margin, text.value, text.ratio);
  if (!layout) {
    return;
  }
  context.fillStyle = light;
  context.fillRect(
    layout.x * scale,
    layout.y * scale,
    layout.width * scale,
    layout.height * scale,
  );
  context.fillStyle = text.color;
  context.font = `700 ${layout.fontSize * scale}px ${TEXT_FONT_STACK}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text.value.trim(), layout.centerX * scale, layout.centerY * scale);
}
