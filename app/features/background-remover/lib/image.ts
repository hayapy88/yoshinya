// Browser-only decoding and encoding. Kept apart from the pixel logic so that
// stays testable without a canvas.

import { LIMITS } from './files';
import type { PixelData, Pixels } from './remove';

export class TooManyPixelsError extends Error {}

function canvasFor(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('2D canvas is unavailable');
  }
  return { canvas, context };
}

/**
 * Decodes to straight (not premultiplied) RGBA. Colour-space conversion is
 * off so the background colour read here is the one stored in the file.
 */
export async function decodeImage(file: Blob): Promise<Pixels> {
  const bitmap = await createImageBitmap(file, {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none',
  });
  try {
    const { width, height } = bitmap;
    if (width * height > LIMITS.maxPixels) {
      throw new TooManyPixelsError();
    }
    const { context } = canvasFor(width, height);
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, width, height);
    return { data, width, height };
  } finally {
    bitmap.close();
  }
}

export function encodePng(
  data: PixelData,
  width: number,
  height: number,
): Promise<Blob> {
  const { canvas, context } = canvasFor(width, height);
  context.putImageData(new ImageData(data, width, height), 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('PNG encoding failed')),
      'image/png',
    );
  });
}
