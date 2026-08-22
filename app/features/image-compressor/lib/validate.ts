import {
  LIMITS,
  SUPPORTED_INPUT_TYPES,
  type ImageErrorCode,
  type RejectedFile,
} from './types';

export type ValidationInput = { name: string; type: string; size: number };

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Accepts what the browser can decode for this tool. The MIME type leads,
 * because it is what decoding will actually go on; the extension is a fallback
 * for the drop sources that report an empty type.
 */
export function isSupportedImage(file: ValidationInput): boolean {
  if ((SUPPORTED_INPUT_TYPES as readonly string[]).includes(file.type)) {
    return true;
  }
  if (file.type !== '') {
    return false;
  }
  const lower = file.name.toLowerCase();
  return EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function rejectionCode(
  file: ValidationInput,
  totals: { count: number; bytes: number },
): ImageErrorCode | null {
  if (!isSupportedImage(file)) {
    return 'unsupported_type';
  }
  if (file.size === 0) {
    return 'empty_file';
  }
  if (file.size > LIMITS.maxFileBytes) {
    return 'file_too_large';
  }
  if (totals.count + 1 > LIMITS.maxFiles) {
    return 'too_many_files';
  }
  if (totals.bytes + file.size > LIMITS.maxTotalBytes) {
    return 'total_too_large';
  }
  return null;
}

/**
 * Splits an incoming batch against the limits. One oversized file never fails
 * the whole drop — the rest are added and the refusals are listed with a
 * reason, which is what someone dragging a folder in actually needs.
 */
export function classifyFiles<T extends ValidationInput>(
  files: T[],
  existing: { count: number; bytes: number },
  makeId: () => string,
): { accepted: T[]; rejected: RejectedFile[] } {
  const accepted: T[] = [];
  const rejected: RejectedFile[] = [];
  const totals = { ...existing };

  for (const file of files) {
    const code = rejectionCode(file, totals);
    if (code) {
      rejected.push({ id: makeId(), name: file.name, errorCode: code });
      continue;
    }
    accepted.push(file);
    totals.count += 1;
    totals.bytes += file.size;
  }

  return { accepted, rejected };
}
