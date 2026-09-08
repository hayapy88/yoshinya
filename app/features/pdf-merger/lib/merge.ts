import { stripPdfExtension } from '~/lib/pdf/filename';
import { parsePageRange } from './page-range';
import type { MergeErrorCode, MergeItem, MergeWarning } from './types';

// pdf-lib is ~400 KB. Loading it only once a PDF is actually added keeps it out
// of the initial bundle, and off the server entirely.
async function loadPdfLib() {
  return import('pdf-lib');
}

type PdfLib = Awaited<ReturnType<typeof loadPdfLib>>;
type LoadedDocument = Awaited<ReturnType<PdfLib['PDFDocument']['load']>>;

export class MergeError extends Error {
  constructor(readonly code: MergeErrorCode) {
    super(code);
    this.name = 'MergeError';
  }
}

function toMergeError(error: unknown, fallback: MergeErrorCode): MergeError {
  if (error instanceof MergeError) {
    return error;
  }
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  if (name === 'EncryptedPDFError' || /encrypt/i.test(message)) {
    return new MergeError('encrypted');
  }
  if (name === 'RangeError' || /allocation|out of memory/i.test(message)) {
    return new MergeError('out_of_memory');
  }
  return new MergeError(fallback);
}

export type PdfInspection = {
  pageCount: number;
  warnings: MergeWarning[];
};

// A digital signature lives in a signature dictionary with a /ByteRange
// covering the bytes it signed. This is a byte scan, not a full parse: it can
// produce a false positive on a PDF that merely mentions the string, and the
// warning is only a disclosure, so that costs a sentence rather than a
// blocked file. It works because a signature's ByteRange has to stay directly
// locatable in the file — it cannot hide inside a compressed object stream.
function isSigned(bytes: Uint8Array): boolean {
  return new TextDecoder('latin1').decode(bytes).includes('/ByteRange');
}

// An interactive form does hide inside a compressed object stream, so scanning
// the bytes for /AcroForm misses most of them. Read the catalog instead.
function hasAcroForm(lib: PdfLib, doc: LoadedDocument): boolean {
  return doc.catalog.get(lib.PDFName.of('AcroForm')) !== undefined;
}

/** Reads page count and disclosures for one file as it is added to the list. */
export async function inspectPdf(file: File): Promise<PdfInspection> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) {
    throw new MergeError('empty_file');
  }
  try {
    const lib = await loadPdfLib();
    // updateMetadata: false keeps pdf-lib from stamping its own Producer and
    // ModDate onto a document we are only reading.
    const doc = await lib.PDFDocument.load(bytes, { updateMetadata: false });
    const warnings: MergeWarning[] = [];
    if (isSigned(bytes)) {
      warnings.push('signed');
    }
    if (hasAcroForm(lib, doc)) {
      warnings.push('has_form');
    }
    return { pageCount: doc.getPageCount(), warnings };
  } catch (error) {
    throw toMergeError(error, 'corrupted');
  }
}

/** The items that will actually be merged: loaded, valid, and with pages. */
export function mergeableItems(items: MergeItem[]): MergeItem[] {
  return items.filter(
    (item) =>
      item.status === 'ready' &&
      item.pageCount !== undefined &&
      parsePageRange(item.pageRange, item.pageCount).ok,
  );
}

/**
 * How many pages the output will have, shown before the merge runs. Getting
 * this wrong is only discoverable after downloading, which is exactly when it
 * is most annoying to find out.
 */
export function totalOutputPages(items: MergeItem[]): number {
  let total = 0;
  for (const item of mergeableItems(items)) {
    const result = parsePageRange(item.pageRange, item.pageCount ?? 0);
    if (result.ok) {
      total += result.pages.length;
    }
  }
  return total;
}

export type MergeProgress = { done: number; total: number };

export type MergeOptions = {
  outputName: string;
  onProgress?: (progress: MergeProgress) => void;
};

// Hands the event loop back so the progress counter actually paints. Without
// it the whole merge runs inside one task and the UI jumps from 0 to done.
const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Merges the given items, in list order, into one PDF.
 *
 * Files are read one at a time on purpose: holding a hundred ArrayBuffers at
 * once is what makes mobile Safari kill the tab, and the copied pages are the
 * only part that has to stay resident.
 */
export async function mergePdfs(
  items: MergeItem[],
  { outputName, onProgress }: MergeOptions,
): Promise<Blob> {
  const sources = mergeableItems(items);
  if (sources.length === 0) {
    throw new MergeError('merge_failed');
  }

  const { PDFDocument } = await loadPdfLib();
  const out = await PDFDocument.create();

  for (const [index, item] of sources.entries()) {
    const bytes = new Uint8Array(await item.sourceFile.arrayBuffer());
    try {
      const src = await PDFDocument.load(bytes, { updateMetadata: false });
      const range = parsePageRange(item.pageRange, src.getPageCount());
      if (!range.ok) {
        throw new MergeError(range.error);
      }
      // One copyPages call per document, never one per page: each call carries
      // its own copy of whatever the pages reference, so splitting it up
      // duplicates the fonts and colour spaces into the output.
      const copied = await out.copyPages(src, range.pages);
      for (const page of copied) {
        out.addPage(page);
      }
    } catch (error) {
      throw toMergeError(error, 'corrupted');
    }
    onProgress?.({ done: index + 1, total: sources.length });
    await yieldToBrowser();
  }

  // A merged file with no Title shows up as "untitled" in every viewer's tab,
  // which is the problem PDF Title Editor exists to fix. Seed it from the name
  // the user chose rather than leaving it for them to fix in the other tool.
  out.setTitle(stripPdfExtension(outputName));

  try {
    const saved = await out.save();
    return new Blob([saved as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    throw toMergeError(error, 'merge_failed');
  }
}
