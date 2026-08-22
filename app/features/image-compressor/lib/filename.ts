import type { EncodableFormat } from './types';

const EXTENSION: Record<EncodableFormat, string> = {
  jpeg: '.jpg',
  png: '.png',
  webp: '.webp',
};

// Already-correct extensions for a format, so a .jpeg is not renamed to .jpg
// for no reason.
const ACCEPTED: Record<EncodableFormat, string[]> = {
  jpeg: ['.jpg', '.jpeg'],
  png: ['.png'],
  webp: ['.webp'],
};

function splitExtension(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.');
  // dot === 0 is a dotfile: the whole name is the base.
  if (dot <= 0) {
    return { base: name, ext: '' };
  }
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

/**
 * Keeps the original name and only corrects the extension when the format
 * changed, so a file the user recognises comes back out.
 */
export function outputFileName(
  sourceName: string,
  format: EncodableFormat,
): string {
  const { base, ext } = splitExtension(sourceName);
  if (ACCEPTED[format].includes(ext.toLowerCase())) {
    return sourceName;
  }
  return `${base}${EXTENSION[format]}`;
}

/**
 * Numbers names that would otherwise collide, which happens as soon as two
 * images from different folders share a name or two formats converge on one
 * extension. Compared case-insensitively, because ZIP entries and most file
 * systems collide that way.
 */
export function resolveDuplicateNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const { base, ext } = splitExtension(name);
    let candidate = name;
    let counter = 1;
    while (used.has(candidate.toLowerCase())) {
      counter += 1;
      candidate = `${base}-${counter}${ext}`;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}
