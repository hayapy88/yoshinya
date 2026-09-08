import { hasPdfExtension } from './filename';
import { LIMITS, type PdfErrorCode, type RejectedFile } from './types';

export type ValidationInput = {
  name: string;
  type: string;
  size: number;
};

export type ClassifyResult<T> = {
  accepted: T[];
  rejected: RejectedFile[];
};

// Some drop sources hand over an empty MIME type for a perfectly good PDF, so
// the extension is the primary signal and a contradicting MIME type is the
// disqualifier — checking both without punishing the empty case.
export function isPdfCandidate(file: ValidationInput): boolean {
  if (!hasPdfExtension(file.name)) {
    return false;
  }
  return file.type === '' || file.type === 'application/pdf';
}

function rejectionCode(
  file: ValidationInput,
  totals: { count: number; bytes: number },
): PdfErrorCode | null {
  if (!isPdfCandidate(file)) {
    return 'not_pdf';
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

// Splits an incoming batch against the limits, counting accepted files toward
// the running totals so a single oversized drop can't slip past in aggregate.
export function classifyFiles<T extends ValidationInput>(
  files: T[],
  existing: { count: number; bytes: number },
  makeId: () => string,
): ClassifyResult<T> {
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
