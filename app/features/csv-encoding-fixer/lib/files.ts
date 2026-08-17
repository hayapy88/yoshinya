import type { Diagnosis } from './encoding'

export const LIMITS = {
  maxFiles: 50,
  maxBytes: 50 * 1024 * 1024,
} as const

export type FileErrorCode = 'empty_file' | 'file_too_large' | 'too_many_files'

export type CsvItem = {
  id: string
  file: File
  bytes: Uint8Array
  diagnosis: Diagnosis
}

export type RejectedFile = { id: string; name: string; errorCode: FileErrorCode }

/**
 * Splits an incoming batch into what can be checked and what cannot, counting
 * against what is already loaded so a second drop cannot walk past the limit.
 */
export function classify(
  files: File[],
  alreadyLoaded: number,
  newId: () => string,
): { accepted: File[]; rejected: RejectedFile[] } {
  const accepted: File[] = []
  const rejected: RejectedFile[] = []
  let count = alreadyLoaded

  for (const file of files) {
    if (count >= LIMITS.maxFiles) {
      rejected.push({ id: newId(), name: file.name, errorCode: 'too_many_files' })
      continue
    }
    if (file.size === 0) {
      rejected.push({ id: newId(), name: file.name, errorCode: 'empty_file' })
      continue
    }
    if (file.size > LIMITS.maxBytes) {
      rejected.push({ id: newId(), name: file.name, errorCode: 'file_too_large' })
      continue
    }
    accepted.push(file)
    count += 1
  }
  return { accepted, rejected }
}

/**
 * The saved name. The fix is invisible from the outside — same rows, same
 * columns — so a suffix is what stops the download replacing, or being mistaken
 * for, the original sitting next to it in the downloads folder.
 */
export function fixedFileName(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0
    ? `${name.slice(0, dot)}_utf8${name.slice(dot)}`
    : `${name}_utf8`
}
