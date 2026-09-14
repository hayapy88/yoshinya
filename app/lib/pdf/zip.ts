import JSZip from 'jszip';

export type PdfZipEntry = { name: string; blob: Blob };

// PDFs are already compressed, so DEFLATE level 1 keeps a large batch from
// locking up the tab for a negligible size difference. Matches the other tools.
export function createPdfZip(entries: PdfZipEntry[]): Promise<Blob> {
  const zip = new JSZip();
  for (const { name, blob } of entries) {
    zip.file(name, blob.arrayBuffer());
  }
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  });
}
