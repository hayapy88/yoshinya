import JSZip from 'jszip'

export type PdfZipEntry = { name: string; blob: Blob }

// PDFs are already compressed, so DEFLATE level 1 keeps a large batch from
// locking up the tab for a negligible size difference. Matches the other tools.
export function createPdfZip(entries: PdfZipEntry[]): Promise<Blob> {
  const zip = new JSZip()
  for (const { name, blob } of entries) {
    zip.file(name, blob.arrayBuffer())
  }
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  })
}

// yoshinya-pdf-title-editor-YYYYMMDD-HHmm.zip, per the spec.
export function zipFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`
  return `yoshinya-pdf-title-editor-${date}-${time}.zip`
}
