import type { PdfErrorCode as SharedPdfErrorCode } from '~/lib/pdf/types';
import type { PageRangeError } from './page-range';

export { LIMITS } from '~/lib/pdf/types';
export type { RejectedFile } from '~/lib/pdf/types';

// The shared intake codes, the two page-range codes, and a failure during the
// merge itself. Nothing here ever carries a file name or a PDF's own text: the
// UI looks the message up from the code.
export type MergeErrorCode =
  SharedPdfErrorCode | PageRangeError | 'merge_failed';

export type MergeItemStatus = 'loading' | 'ready' | 'error';

// Merging always writes a new document, so a signature on a source PDF cannot
// survive it and a form's fields are dropped by page copying. Neither stops the
// merge — they are disclosed instead, because the alternative is a user who
// finds out after sending the file.
export type MergeWarning = 'signed' | 'has_form';

export type MergeItem = {
  id: string;
  sourceFile: File;
  fileName: string;
  size: number;
  pageCount?: number;
  // What the user typed. Empty means every page; kept verbatim so the field
  // does not rewrite itself while it is being edited.
  pageRange: string;
  warnings: MergeWarning[];
  status: MergeItemStatus;
  errorCode?: MergeErrorCode;
};

export const DEFAULT_OUTPUT_NAME = 'merged.pdf';
