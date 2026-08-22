import { formatKeywords, normalizeTextField, parseKeywords } from './metadata'
import { readXmp, syncXmp } from './xmp'
import type { PdfErrorCode, PdfMetadataForm } from './types'

type PdfLib = Awaited<ReturnType<typeof loadPdfLib>>
type LoadedDocument = Awaited<ReturnType<PdfLib['PDFDocument']['load']>>

export type PdfReadResult = {
  pageCount: number
  metadata: PdfMetadataForm
  // Signed PDFs load fine but must not be re-saved, so this is reported rather
  // than thrown and the caller blocks editing.
  hasSignature: boolean
}

export class PdfToolError extends Error {
  constructor(readonly code: PdfErrorCode) {
    super(code)
    this.name = 'PdfToolError'
  }
}

// pdf-lib is ~400 KB. Loading it only once a PDF is actually added keeps it out
// of the initial bundle, and off the server entirely.
async function loadPdfLib() {
  return import('pdf-lib')
}

// A digital signature lives in a signature dictionary with a /ByteRange
// covering the bytes it signed. Re-saving rewrites those offsets and voids the
// signature, so detect it before letting anyone edit. This is a byte scan, not
// a full parse: it can produce a false positive on a PDF that merely mentions
// the string, which the help content discloses.
function detectSignature(bytes: Uint8Array): boolean {
  const marker = '/ByteRange'
  const haystack = new TextDecoder('latin1').decode(bytes)
  return haystack.includes(marker)
}

function toPdfToolError(error: unknown): PdfToolError {
  if (error instanceof PdfToolError) {
    return error
  }
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : String(error)
  if (name === 'EncryptedPDFError' || /encrypt/i.test(message)) {
    return new PdfToolError('encrypted')
  }
  if (name === 'RangeError' || /allocation|out of memory/i.test(message)) {
    return new PdfToolError('out_of_memory')
  }
  return new PdfToolError('corrupted')
}

export async function readPdf(file: File): Promise<PdfReadResult> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.length === 0) {
    throw new PdfToolError('empty_file')
  }
  try {
    const lib = await loadPdfLib()
    // updateMetadata: false keeps pdf-lib from stamping its own Producer and
    // ModDate onto a document the user only wanted to read.
    const doc = await lib.PDFDocument.load(bytes, { updateMetadata: false })
    // The Info dictionary is authoritative for what this tool edits, but a
    // value that exists only in XMP is still a value the user can see in their
    // viewer — surface it rather than showing the field as empty and then
    // deleting it on save.
    const xml = readXmpPacket(lib, doc)
    const fromXmp = xml === null ? null : readXmp(xml)
    const fallback = (info: string, xmp: string | undefined) =>
      info !== '' ? info : normalizeTextField(xmp ?? '')
    const infoKeywords = parseKeywords(doc.getKeywords() ?? '')
    return {
      pageCount: doc.getPageCount(),
      metadata: {
        title: fallback(
          normalizeTextField(doc.getTitle() ?? ''),
          fromXmp?.title,
        ),
        author: fallback(
          normalizeTextField(doc.getAuthor() ?? ''),
          fromXmp?.author,
        ),
        subject: fallback(
          normalizeTextField(doc.getSubject() ?? ''),
          fromXmp?.subject,
        ),
        keywords:
          infoKeywords.length > 0 ? infoKeywords : (fromXmp?.keywords ?? []),
      },
      hasSignature: detectSignature(bytes),
    }
  } catch (error) {
    throw toPdfToolError(error)
  }
}

// Reads the raw XMP packet, decompressing it when necessary. Returns null when
// the document has none or it cannot be decoded.
function readXmpPacket(lib: PdfLib, doc: LoadedDocument): string | null {
  const { PDFName, PDFRawStream, decodePDFRawStream } = lib
  const ref = doc.catalog.get(PDFName.of('Metadata'))
  if (!ref) {
    return null
  }
  const stream = doc.context.lookup(ref)
  if (!(stream instanceof PDFRawStream)) {
    return null
  }
  try {
    return new TextDecoder().decode(decodePDFRawStream(stream).decode())
  } catch {
    return null
  }
}

// Rewrites the document's XMP packet, if it has one, so it cannot contradict
// the Info dictionary. Deliberately best-effort: an XMP packet we cannot read
// or parse is left exactly as it was, because losing it would destroy metadata
// this tool has no business touching (creator tool, rights, custom schemas).
function syncXmpPacket(
  lib: PdfLib,
  doc: LoadedDocument,
  metadata: PdfMetadataForm,
): void {
  const { PDFName, PDFRef } = lib
  const xml = readXmpPacket(lib, doc)
  if (xml === null) {
    return
  }
  const ref = doc.catalog.get(PDFName.of('Metadata'))
  if (!ref) {
    return
  }
  const updated = syncXmp(xml, metadata)
  if (updated === null) {
    return
  }
  // Encoded to UTF-8 by hand: handing context.stream() a string writes one byte
  // per character, which mangles every non-ASCII title. XMP packets are UTF-8
  // by specification. Written back uncompressed, as the specification
  // recommends, so tools can still locate the packet by scanning.
  //
  // Uint8Array.from copies into this realm's array type. pdf-lib decides how to
  // treat the value with `instanceof Uint8Array`, which is false for an array
  // built by a TextEncoder from another realm — as happens under jsdom, where
  // it would silently fall back to one-byte-per-character again.
  const encoded = Uint8Array.from(new TextEncoder().encode(updated))
  const replacement = doc.context.stream(encoded, {
    Type: 'Metadata',
    Subtype: 'XML',
  })
  if (ref instanceof PDFRef) {
    doc.context.assign(ref, replacement)
  } else {
    doc.catalog.set(PDFName.of('Metadata'), doc.context.register(replacement))
  }
}

export async function writePdf(
  file: File,
  metadata: PdfMetadataForm,
): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  try {
    const lib = await loadPdfLib()
    const doc = await lib.PDFDocument.load(bytes, { updateMetadata: false })
    doc.setTitle(metadata.title)
    doc.setAuthor(metadata.author)
    doc.setSubject(metadata.subject)
    // setKeywords joins its array with a space, which destroys the boundaries
    // of multi-word keywords. Join them ourselves so the stored string parses
    // back into the same array.
    doc.setKeywords([formatKeywords(metadata.keywords)])
    syncXmpPacket(lib, doc, metadata)
    const output = await doc.save()
    return new Blob([output as BlobPart], { type: 'application/pdf' })
  } catch (error) {
    const mapped = toPdfToolError(error)
    throw mapped.code === 'corrupted'
      ? new PdfToolError('write_failed')
      : mapped
  }
}

// Reloads generated output and confirms the requested values actually landed,
// per FR-06. Returns the metadata that is really in the file.
export async function verifyOutput(blob: Blob): Promise<PdfMetadataForm> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const { PDFDocument } = await loadPdfLib()
  const doc = await PDFDocument.load(bytes, { updateMetadata: false })
  return {
    title: normalizeTextField(doc.getTitle() ?? ''),
    author: normalizeTextField(doc.getAuthor() ?? ''),
    subject: normalizeTextField(doc.getSubject() ?? ''),
    keywords: parseKeywords(doc.getKeywords() ?? ''),
  }
}
