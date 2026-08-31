/**
 * Rasterises an SVG string to a PNG blob at the given pixel size.
 *
 * The SVG is loaded through a blob URL rather than a data URL: a data URL of an
 * SVG has to be percent-encoded, and getting that wrong for a document
 * containing quotes and `#` colours fails silently as a blank image.
 *
 * The canvas is never tainted, because the generated SVG references nothing
 * outside itself — no fonts, no images, no stylesheets. That is what makes
 * `toBlob` legal here, and it is another reason the icon markup is a build-time
 * artifact rather than anything the user can supply.
 */
export async function svgToPngBlob(svg: string, size: number): Promise<Blob> {
  const url = URL.createObjectURL(
    new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
  );
  try {
    const image = new Image();
    // Some browsers size an SVG <img> from the document's own width/height and
    // draw nothing when they are missing. buildSvg always writes both; this
    // pair makes the intended resolution explicit regardless.
    image.width = size;
    image.height = size;
    image.src = url;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas is unavailable');
    }
    // Left unpainted, so an icon without a background exports with a
    // transparent one instead of a white square.
    context.drawImage(image, 0, 0, size, size);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('The PNG could not be created'));
        }
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
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
