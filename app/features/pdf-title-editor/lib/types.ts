export type PdfItemStatus =
  | 'loading'
  | 'ready'
  | 'modified'
  | 'processing'
  | 'completed'
  | 'warning'
  | 'error';

export type PdfMetadataForm = {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
};

// Stable codes so the UI can look up localized copy without ever putting a
// filename or a PDF's own text into an error message.
export type PdfErrorCode =
  | 'not_pdf'
  | 'empty_file'
  | 'corrupted'
  | 'encrypted'
  | 'signed'
  | 'file_too_large'
  | 'total_too_large'
  | 'too_many_files'
  | 'out_of_memory'
  | 'write_failed';

export type PdfItem = {
  id: string;
  sourceFile: File;
  originalFileName: string;
  outputFileName: string;
  size: number;
  pageCount?: number;
  originalMetadata?: PdfMetadataForm;
  editedMetadata?: PdfMetadataForm;
  status: PdfItemStatus;
  errorCode?: PdfErrorCode;
  outputBlob?: Blob;
};

// A file that was refused before it could become a PdfItem.
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
