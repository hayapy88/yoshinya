import type { PdfErrorCode as SharedPdfErrorCode } from '~/lib/pdf/types';

export { LIMITS } from '~/lib/pdf/types';
export type { RejectedFile } from '~/lib/pdf/types';

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

// The shared intake codes plus the two only this tool can produce: it is the
// only PDF tool that re-saves a document in place, so a signature it would void
// blocks editing, and a failed write is distinct from a file that never parsed.
export type PdfErrorCode = SharedPdfErrorCode | 'signed' | 'write_failed';

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
