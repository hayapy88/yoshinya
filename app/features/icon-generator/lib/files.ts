import type { ExportSettings } from './style';

export const ZIP_FILE_NAME = 'yoshinya-icons.zip';

// No size in the name: one SVG covers every size, so a number here would
// suggest the file is tied to it.
export function svgFileName(id: string): string {
  return `${id}.svg`;
}

// The size is in the name because several resolutions of the same icon end up
// in the same folder, and `house.png` three times over is useless.
export function pngFileName(id: string, size: number): string {
  return `${id}-${size}.png`;
}

// Sorted into folders so a ZIP of both formats at three sizes unpacks into
// something a person can navigate rather than 200 files in one heap.
export function zipEntryPath(name: string, size?: number): string {
  return size === undefined ? `svg/${name}` : `png/${size}/${name}`;
}

/**
 * How many files the ZIP will hold. The button says this number before the
 * work starts, so it has to be derived the same way the ZIP is filled rather
 * than estimated separately.
 */
export function plannedFileCount(
  selectedCount: number,
  settings: ExportSettings,
): number {
  const perIcon =
    (settings.svg ? 1 : 0) + (settings.png ? settings.pngSizes.length : 0);
  return selectedCount * perIcon;
}
