/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import { readPdf, writePdf } from './pdf'
import type { PdfMetadataForm } from './types'

// The regression these guard: a PDF stores document properties in two places,
// and editing only the Info dictionary leaves a file whose /Title and dc:title
// disagree. Readers differ over which one they trust, and Acrobat's Document
// Properties reads XMP when it is there.
// Needs jsdom because the XMP editing goes through DOMParser.

const XMP_NS = `xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"`

function packet(body: string): string {
  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF ${XMP_NS}>
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/">
${body}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`
}

const titleBody = (title: string) =>
  `   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>`

async function makePdfWithXmp(
  xmp: string,
  setup: (doc: PDFDocument) => void = () => {},
): Promise<File> {
  const doc = await PDFDocument.create()
  doc.addPage()
  setup(doc)
  const stream = doc.context.stream(xmp, { Type: 'Metadata', Subtype: 'XML' })
  doc.catalog.set(PDFName.of('Metadata'), doc.context.register(stream))
  const bytes = await doc.save()
  return new File([bytes as BlobPart], 'source.pdf', {
    type: 'application/pdf',
  })
}

async function xmpOf(blob: Blob): Promise<string> {
  const doc = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()), {
    updateMetadata: false,
  })
  const stream = doc.context.lookup(doc.catalog.get(PDFName.of('Metadata')))
  if (!(stream instanceof PDFRawStream)) {
    throw new Error('no XMP packet in output')
  }
  return new TextDecoder().decode(decodePDFRawStream(stream).decode())
}

const metadata = (over: Partial<PdfMetadataForm> = {}): PdfMetadataForm => ({
  title: '',
  author: '',
  subject: '',
  keywords: [],
  ...over,
})

describe('XMP stays in step with the Info dictionary', () => {
  it('updates the XMP title, not just the Info dictionary one', async () => {
    const file = await makePdfWithXmp(packet(titleBody('OLD XMP TITLE')), (doc) =>
      doc.setTitle('OLD INFO TITLE'),
    )
    const out = await writePdf(file, metadata({ title: 'NEW TITLE' }))

    const reloaded = await PDFDocument.load(
      new Uint8Array(await out.arrayBuffer()),
      { updateMetadata: false },
    )
    expect(reloaded.getTitle()).toBe('NEW TITLE')

    const xml = await xmpOf(out)
    expect(xml).toContain('NEW TITLE')
    expect(xml).not.toContain('OLD XMP TITLE')
  })

  it('syncs author, subject, and keywords as well', async () => {
    const file = await makePdfWithXmp(packet(titleBody('OLD')))
    const out = await writePdf(
      file,
      metadata({
        title: 'T',
        author: 'よしにゃ',
        subject: 'S',
        keywords: ['annual report', '決算'],
      }),
    )
    const xml = await xmpOf(out)
    expect(xml).toContain('よしにゃ')
    expect(xml).toContain('annual report')
    expect(xml).toContain('決算')
  })

  it('keeps XMP properties the tool does not own', async () => {
    const file = await makePdfWithXmp(
      packet(`   <xmp:CreatorTool>Acme Writer 1.0</xmp:CreatorTool>\n${titleBody('OLD')}`),
    )
    const out = await writePdf(file, metadata({ title: 'NEW' }))
    expect(await xmpOf(out)).toContain('Acme Writer 1.0')
  })

  it('removes the XMP title when the user clears the field', async () => {
    const file = await makePdfWithXmp(packet(titleBody('OLD')), (doc) =>
      doc.setTitle('OLD'),
    )
    const out = await writePdf(file, metadata())
    const xml = await xmpOf(out)
    expect(xml).not.toContain('OLD')
    expect(xml).not.toContain('dc:title')
  })

  it('surfaces a title that exists only in XMP instead of showing it as empty', async () => {
    const file = await makePdfWithXmp(packet(titleBody('XMP ONLY TITLE')))
    const result = await readPdf(file)
    expect(result.metadata.title).toBe('XMP ONLY TITLE')
  })

  it('does not let an XMP-only title be deleted by an unrelated edit', async () => {
    // Read, change only the author, write back — the title must survive.
    const file = await makePdfWithXmp(packet(titleBody('XMP ONLY TITLE')))
    const read = await readPdf(file)
    const out = await writePdf(file, { ...read.metadata, author: 'Yoshinya' })
    expect(await xmpOf(out)).toContain('XMP ONLY TITLE')
  })

  it('prefers the Info dictionary when both are present', async () => {
    const file = await makePdfWithXmp(packet(titleBody('XMP TITLE')), (doc) =>
      doc.setTitle('INFO TITLE'),
    )
    expect((await readPdf(file)).metadata.title).toBe('INFO TITLE')
  })

  it('leaves a PDF without XMP exactly as before', async () => {
    const doc = await PDFDocument.create()
    doc.addPage()
    doc.setTitle('Old')
    const file = new File([(await doc.save()) as BlobPart], 'plain.pdf')
    const out = await writePdf(file, metadata({ title: 'New' }))
    const reloaded = await PDFDocument.load(
      new Uint8Array(await out.arrayBuffer()),
      { updateMetadata: false },
    )
    expect(reloaded.getTitle()).toBe('New')
    // No XMP packet was invented for it.
    expect(reloaded.catalog.get(PDFName.of('Metadata'))).toBeUndefined()
  })
})
