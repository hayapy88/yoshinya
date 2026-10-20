// Which files are accepted, and what they are called on the way out.

export const LIMITS = {
  maxFiles: 200,
  maxFileBytes: 30 * 1024 * 1024,
  maxTotalBytes: 500 * 1024 * 1024,
  // Width × height. One RGBA copy of this is 160 MB, and the tool holds a few
  // at once while it works.
  maxPixels: 40_000_000,
} as const;

export const ACCEPT = 'image/jpeg,image/png,image/webp';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export type RejectionCode =
  | 'unsupported_type'
  | 'empty_file'
  | 'file_too_large'
  | 'too_many_files'
  | 'total_too_large';

export type Rejected = { name: string; code: RejectionCode };

type FileLike = { name: string; type: string; size: number };

/**
 * The MIME type leads, because it is what decoding will go on; the extension
 * is a fallback for the drop sources that report an empty type.
 */
export function isSupportedImage(file: FileLike): boolean {
  if (TYPES.includes(file.type)) {
    return true;
  }
  if (file.type !== '') {
    return false;
  }
  const lower = file.name.toLowerCase();
  return EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Splits an incoming batch against the limits. One unsuitable file never
 * fails the whole drop: the rest are added and the refusals listed.
 */
export function classifyFiles<T extends FileLike>(
  files: T[],
  existing: { count: number; bytes: number },
): { accepted: T[]; rejected: Rejected[] } {
  const accepted: T[] = [];
  const rejected: Rejected[] = [];
  let { count, bytes } = existing;
  for (const file of files) {
    const code: RejectionCode | null = !isSupportedImage(file)
      ? 'unsupported_type'
      : file.size === 0
        ? 'empty_file'
        : file.size > LIMITS.maxFileBytes
          ? 'file_too_large'
          : count + 1 > LIMITS.maxFiles
            ? 'too_many_files'
            : bytes + file.size > LIMITS.maxTotalBytes
              ? 'total_too_large'
              : null;
    if (code) {
      rejected.push({ name: file.name, code });
      continue;
    }
    accepted.push(file);
    count += 1;
    bytes += file.size;
  }
  return { accepted, rejected };
}

function splitExtension(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.');
  // dot === 0 is a dotfile: the whole name is the base.
  if (dot <= 0) {
    return { base: name, ext: '' };
  }
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

/**
 * The original name as a PNG, the only common format that keeps transparency
 * and opens everywhere. A PNG keeps its name exactly.
 */
export function outputFileName(sourceName: string): string {
  const { base, ext } = splitExtension(sourceName);
  if (ext.toLowerCase() === '.png') {
    return sourceName;
  }
  return `${base}.png`;
}

/**
 * Numbers names that would collide in the ZIP — logo.jpg and logo.png both
 * come out as logo.png. Case-insensitive, as most file systems are.
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

export function zipFileName(): string {
  return 'yoshinya-transparent-images.zip';
}
