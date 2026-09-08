// Stable codes so the UI can look up localized copy without ever putting a
// filename or a PDF's own text into an error message. Only the codes every PDF
// tool can produce live here; a tool that has failure modes of its own widens
// this union locally.
export type PdfErrorCode =
  | 'not_pdf'
  | 'empty_file'
  | 'corrupted'
  | 'encrypted'
  | 'file_too_large'
  | 'total_too_large'
  | 'too_many_files'
  | 'out_of_memory';

// A file that was refused before it could become an item in a tool's list.
// Intake only ever rejects for the shared reasons, so this is not widened
// alongside a tool's own error union.
export type RejectedFile = {
  id: string;
  name: string;
  errorCode: PdfErrorCode;
};

// Configurable per the spec: browser memory may bite well before these.
export const LIMITS = {
  maxFileBytes: 100 * 1024 * 1024,
  maxTotalBytes: 500 * 1024 * 1024,
  maxFiles: 100,
  maxTextLength: 1000,
  maxKeywords: 100,
} as const;
