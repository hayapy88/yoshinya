// Disclosures and failure codes shared by the PDF tools.
//
// Both PDF Merger and PDF Page Organizer write a new document from copied
// pages, so both have the same two things to disclose and the same handful of
// failures to name. Keeping one copy of each is the rule the merger set when
// validate.ts and filename.ts moved here: two copies of a check like this drift
// the moment one of them is corrected.

type PdfLib = typeof import('pdf-lib');
type LoadedDocument = Awaited<ReturnType<PdfLib['PDFDocument']['load']>>;

/**
 * A digital signature lives in a signature dictionary with a /ByteRange
 * covering the bytes it signed. This is a byte scan, not a full parse: it can
 * produce a false positive on a PDF that merely mentions the string, and the
 * warning is only a disclosure, so that costs a sentence rather than a blocked
 * file. It works because a signature's ByteRange has to stay directly locatable
 * in the file — it cannot hide inside a compressed object stream.
 */
export function isSigned(bytes: Uint8Array): boolean {
  return new TextDecoder('latin1').decode(bytes).includes('/ByteRange');
}

/**
 * An interactive form does hide inside a compressed object stream, so scanning
 * the bytes for /AcroForm misses most of them. Read the catalog instead.
 */
export function hasAcroForm(lib: PdfLib, doc: LoadedDocument): boolean {
  return doc.catalog.get(lib.PDFName.of('AcroForm')) !== undefined;
}

/**
 * The two failures every PDF tool reports the same way, recognised from what
 * pdf-lib and the browser actually throw. Anything else is the caller's to
 * name, because only it knows which step was running.
 */
export function sharedPdfFailure(
  error: unknown,
): 'encrypted' | 'out_of_memory' | null {
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  if (name === 'EncryptedPDFError' || /encrypt/i.test(message)) {
    return 'encrypted';
  }
  if (name === 'RangeError' || /allocation|out of memory/i.test(message)) {
    return 'out_of_memory';
  }
  return null;
}
