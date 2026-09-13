import { stripPdfExtension } from '~/lib/pdf/filename';
import { hasAcroForm, isSigned, sharedPdfFailure } from '~/lib/pdf/inspect';
import type { PdfZipEntry } from '~/lib/pdf/zip';
import { splitFileName } from './filename';
import { normalizeAngle } from './pages';
import {
  LIMITS,
  type OrganizeErrorCode,
  type OrganizeWarning,
  type PageItem,
  type Segment,
} from './types';

// pdf-lib is ~400 KB. Loading it only once a PDF is actually added keeps it out
// of the initial bundle, and off the server entirely.
async function loadPdfLib() {
  return import('pdf-lib');
}

export class OrganizeError extends Error {
  constructor(readonly code: OrganizeErrorCode) {
    super(code);
    this.name = 'OrganizeError';
  }
}

function toOrganizeError(
  error: unknown,
  fallback: OrganizeErrorCode,
): OrganizeError {
  if (error instanceof OrganizeError) {
    return error;
  }
  return new OrganizeError(sharedPdfFailure(error) ?? fallback);
}

export type PdfInspection = {
  pageCount: number;
  /** The /Rotate each page already carries, in page order. */
  rotations: number[];
  warnings: OrganizeWarning[];
};

/**
 * Reads the page count, each page's existing rotation, and the disclosures for
 * the file being opened. The bytes are handed back so the caller can keep them:
 * this is the copy pdf-lib writes from, and it must not be the one pdf.js gets.
 */
export async function inspectPdf(bytes: Uint8Array): Promise<PdfInspection> {
  if (bytes.length === 0) {
    throw new OrganizeError('empty_file');
  }
  try {
    const lib = await loadPdfLib();
    // updateMetadata: false keeps pdf-lib from stamping its own Producer and
    // ModDate onto a document we are only reading.
    const doc = await lib.PDFDocument.load(bytes, { updateMetadata: false });
    const pageCount = doc.getPageCount();
    if (pageCount > LIMITS.maxPages) {
      throw new OrganizeError('too_many_pages');
    }
    const warnings: OrganizeWarning[] = [];
    if (isSigned(bytes)) {
      warnings.push('signed');
    }
    if (hasAcroForm(lib, doc)) {
      warnings.push('has_form');
    }
    return {
      pageCount,
      rotations: doc
        .getPages()
        .map((page) => normalizeAngle(page.getRotation().angle)),
      warnings,
    };
  } catch (error) {
    throw toOrganizeError(error, 'corrupted');
  }
}

export type OrganizeProgress = { done: number; total: number };

export type OrganizeOptions = {
  outputName: string;
  onProgress?: (progress: OrganizeProgress) => void;
};

// Hands the event loop back so the progress counter actually paints. Without
// it a fifty-file split runs inside one task and the UI jumps from 0 to done.
const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Writes the edited document out, one file per segment.
 *
 * The source is read once and every output is copied from it. Pages keep the
 * order they have in `pages`, which is the order the grid shows, and each one
 * is written with the absolute rotation it ended up with.
 */
export async function buildOutputs(
  bytes: Uint8Array,
  pages: PageItem[],
  segments: Segment[],
  { outputName, onProgress }: OrganizeOptions,
): Promise<PdfZipEntry[]> {
  if (pages.length === 0) {
    throw new OrganizeError('no_pages_left');
  }
  if (segments.length === 0) {
    throw new OrganizeError('organize_failed');
  }

  const { PDFDocument, degrees } = await loadPdfLib();
  let source;
  try {
    source = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    throw toOrganizeError(error, 'corrupted');
  }

  const entries: PdfZipEntry[] = [];
  for (const [index, segment] of segments.entries()) {
    const slice = pages.slice(segment.start, segment.end);
    if (slice.length === 0) {
      throw new OrganizeError('no_pages_left');
    }
    const name =
      segments.length === 1
        ? outputName
        : splitFileName(outputName, index + 1, segments.length);

    try {
      const out = await PDFDocument.create();
      // One copyPages call per output, never one per page: each call carries
      // its own copy of whatever the pages reference, so splitting it up
      // duplicates the fonts and colour spaces into the file.
      const copied = await out.copyPages(
        source,
        slice.map((page) => page.sourceIndex),
      );
      copied.forEach((page, position) => {
        const item = slice[position]!;
        if (item.rotation !== item.baseRotation) {
          page.setRotation(degrees(item.rotation));
        }
        out.addPage(page);
      });
      // A file with no Title shows up as "untitled" in every viewer's tab,
      // which is the problem PDF Title Editor exists to fix. Seed it from the
      // name this file is being saved under.
      out.setTitle(stripPdfExtension(name));
      const saved = await out.save();
      entries.push({
        name,
        blob: new Blob([saved as BlobPart], { type: 'application/pdf' }),
      });
    } catch (error) {
      throw toOrganizeError(error, 'organize_failed');
    }

    onProgress?.({ done: index + 1, total: segments.length });
    await yieldToBrowser();
  }

  return entries;
}
