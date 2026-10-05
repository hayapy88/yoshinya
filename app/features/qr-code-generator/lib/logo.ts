/**
 * Placing a logo in the middle of a QR code.
 *
 * The code survives it because of error correction: the modules under the logo
 * are read as damage and rebuilt from the redundant data. That only works
 * while the damage stays small, so the size is capped here rather than left to
 * the person dragging the slider.
 */

/**
 * Share of the code's width the logo may cover.
 *
 * At error-correction level H about 30% of the code can be rebuilt. A quarter
 * of the width is about 6% of the area, well inside that, and leaves room for
 * the damage a printed code actually picks up — a crease, a thumbprint, a
 * scratch — which is the margin the redundancy is really there for.
 */
export const LOGO_RATIO_MIN = 0.1;
export const LOGO_RATIO_MAX = 0.25;
export const LOGO_RATIO_DEFAULT = 0.2;

/** Browsers can all render these, and none of them can carry a script. */
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export type LogoRejection = 'type' | 'size';

export type LogoBox = {
  /** Logo position and size, in module units, including the quiet zone. */
  x: number;
  y: number;
  size: number;
  /** The backing panel painted under it, so modules never show through. */
  backingX: number;
  backingY: number;
  backingSize: number;
};

/**
 * Where the logo sits, in module units.
 *
 * The backing panel is a module wider on each side than the logo: without it,
 * a logo with transparent parts leaves fragments of module showing through,
 * and a scanner reads those fragments as data rather than as damage.
 */
export function logoBox(
  count: number,
  margin: number,
  ratio: number,
): LogoBox {
  const clamped = Math.min(LOGO_RATIO_MAX, Math.max(LOGO_RATIO_MIN, ratio));
  const size = count * clamped;
  const offset = margin + (count - size) / 2;
  const backingSize = size + 2;
  return {
    x: offset,
    y: offset,
    size,
    backingX: offset - 1,
    backingY: offset - 1,
    backingSize,
  };
}

export function rejectLogo(file: File): LogoRejection | null {
  if (!LOGO_TYPES.includes(file.type)) {
    return 'type';
  }
  if (file.size > LOGO_MAX_BYTES) {
    return 'size';
  }
  return null;
}

/**
 * Reads the file as a data URL.
 *
 * A data URL rather than a blob URL: the same string goes into the SVG that is
 * saved to disk, where a blob URL would be a reference to a page that no
 * longer exists. It never leaves the browser either way.
 */
export function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The file could not be read'));
    reader.readAsDataURL(file);
  });
}
