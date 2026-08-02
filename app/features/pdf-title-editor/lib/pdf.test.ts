import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { PdfToolError, readPdf, verifyOutput, writePdf } from './pdf'
import type { PdfMetadataForm } from './types'

// Integration coverage against the real pdf-lib: these are the guarantees the
// UI relies on, and the keyword join in particular is easy to regress.

async function makePdf(
  setup: (doc: PDFDocument) => void = () => {},
  pages = 1,
): Promise<File> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pages; i += 1) {
    doc.addPage()
  }
  setup(doc)
  const bytes = await doc.save()
  return new File([bytes as BlobPart], 'source.pdf', {
    type: 'application/pdf',
  })
}

const metadata = (over: Partial<PdfMetadataForm> = {}): PdfMetadataForm => ({
  title: '',
  author: '',
  subject: '',
  keywords: [],
  ...over,
})

describe('readPdf', () => {
  it('reads the page count and existing metadata', async () => {
    const file = await makePdf((doc) => {
      doc.setTitle('Original Title')
      doc.setAuthor('Yoshinya')
      doc.setSubject('Testing')
    }, 3)
    const result = await readPdf(file)
    expect(result.pageCount).toBe(3)
    expect(result.metadata.title).toBe('Original Title')
    expect(result.metadata.author).toBe('Yoshinya')
    expect(result.metadata.subject).toBe('Testing')
    expect(result.hasSignature).toBe(false)
  })

  it('reports missing metadata as blank rather than undefined', async () => {
    const result = await readPdf(await makePdf())
    expect(result.metadata).toEqual(metadata())
  })

  it('rejects a zero-byte file', async () => {
    const file = new File([], 'empty.pdf', { type: 'application/pdf' })
    await expect(readPdf(file)).rejects.toMatchObject({ code: 'empty_file' })
  })

  it('rejects bytes that are not a PDF', async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'broken.pdf')
    await expect(readPdf(file)).rejects.toBeInstanceOf(PdfToolError)
    await expect(readPdf(file)).rejects.toMatchObject({ code: 'corrupted' })
  })
})

describe('writePdf', () => {
  it('saves a new title that survives a reload', async () => {
    const file = await makePdf((doc) => doc.setTitle('Old'))
    const blob = await writePdf(file, metadata({ title: 'New Title' }))
    expect((await verifyOutput(blob)).title).toBe('New Title')
  })

  it('keeps Japanese and emoji intact', async () => {
    const file = await makePdf()
    const blob = await writePdf(
      file,
      metadata({ title: '2026年 決算報告 🐱', author: 'よしにゃ' }),
    )
    const saved = await verifyOutput(blob)
    expect(saved.title).toBe('2026年 決算報告 🐱')
    expect(saved.author).toBe('よしにゃ')
  })

  it('preserves the boundaries of multi-word keywords', async () => {
    const keywords = ['annual report', 'fiscal 2026', '決算 資料']
    const blob = await writePdf(await makePdf(), metadata({ keywords }))
    expect((await verifyOutput(blob)).keywords).toEqual(keywords)
  })

  it('clears a value when the user saves a blank field', async () => {
    const file = await makePdf((doc) => doc.setTitle('Old'))
    const blob = await writePdf(file, metadata({ title: '' }))
    expect((await verifyOutput(blob)).title).toBe('')
  })

  it('preserves page content and order', async () => {
    const file = await makePdf(() => {}, 4)
    const blob = await writePdf(file, metadata({ title: 'x' }))
    const reloaded = await PDFDocument.load(
      new Uint8Array(await blob.arrayBuffer()),
      { updateMetadata: false },
    )
    expect(reloaded.getPageCount()).toBe(4)
  })

  it('does not overwrite the source file', async () => {
    const file = await makePdf((doc) => doc.setTitle('Old'))
    const before = await file.arrayBuffer()
    await writePdf(file, metadata({ title: 'New' }))
    const after = await file.arrayBuffer()
    expect(new Uint8Array(after)).toEqual(new Uint8Array(before))
  })

  it('leaves the Producer alone instead of stamping pdf-lib over it', async () => {
    const file = await makePdf((doc) => doc.setProducer('Acme Writer 1.0'))
    const blob = await writePdf(file, metadata({ title: 'New' }))
    const reloaded = await PDFDocument.load(
      new Uint8Array(await blob.arrayBuffer()),
      { updateMetadata: false },
    )
    expect(reloaded.getProducer()).toBe('Acme Writer 1.0')
  })
})
