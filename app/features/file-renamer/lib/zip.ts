import JSZip from 'jszip';

export type ZipEntry = {
  name: string; // file name inside the zip (already renamed)
  file: Blob;
};

export function createZipBlob(entries: ZipEntry[]): Promise<Blob> {
  const zip = new JSZip();
  for (const { name, file } of entries) {
    // Read via arrayBuffer() rather than passing the Blob directly:
    // JSZip's Blob reader needs FileReader, which Node (Vitest) lacks.
    zip.file(name, file.arrayBuffer());
  }
  return zip.generateAsync({ type: 'blob' });
}
