import type { PdfErrorCode } from '~/lib/pdf/types';

export { LIMITS } from '~/lib/pdf/types';
export type { RejectedFile } from '~/lib/pdf/types';

// The shared intake codes plus this tool's own. A page organiser can fail in
// ways no other PDF tool can — a document too long to draw, an output with no
// pages left in it — so the union widens here rather than in the shared file.
// Nothing here ever carries a file name or a PDF's own text: the UI looks the
// message up from the code.
export type OrganizeErrorCode =
  | PdfErrorCode
  | 'too_many_pages'
  | 'render_failed'
  | 'no_pages_left'
  | 'split_no_boundary'
  | 'split_invalid'
  | 'organize_failed';

// Editing pages writes a new document, so a signature cannot survive it and a
// form's fields are dropped by page copying. Neither stops the work — they are
// disclosed, because the alternative is a user who finds out after sending the
// file.
export type OrganizeWarning = 'signed' | 'has_form';

export type PageItem = {
  id: string;
  // Where the page sits in the source document, 0-indexed. It never changes,
  // which is what lets a card keep saying "page 7 of the original" after the
  // list has been reordered and cut about.
  sourceIndex: number;
  // The rotation the page already carried. Thumbnails come out of pdf.js with
  // this applied, so the preview only has to turn by the difference.
  baseRotation: number;
  // The absolute rotation to write, 0/90/180/270. Absolute rather than a delta:
  // pdf-lib's setRotation replaces the angle, and a page that was already at 90
  // is exactly where "set 90" silently does nothing.
  rotation: number;
};

/** A run of consecutive pages that becomes one output file. */
export type Segment = { start: number; end: number };

export type OutputMode = 'single' | 'split';
export type SplitMode = 'boundaries' | 'every-n' | 'selection';

export const DEFAULT_SPLIT_SIZE = 1;
