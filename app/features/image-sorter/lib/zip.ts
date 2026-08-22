import JSZip from 'jszip';
import type { ZipEntry } from './zip-entries';

// Builds the ZIP blob from folder-prefixed entries. Reads each file via
// arrayBuffer() (JSZip's Blob reader needs FileReader, which Node/Vitest lacks)
// and uses DEFLATE level 1 so large image batches don't block the UI for long
// — images are already compressed, so a higher level buys almost nothing.
export function createZipBlob(entries: ZipEntry[]): Promise<Blob> {
  const zip = new JSZip();
  for (const { path, file } of entries) {
    zip.file(path, file.arrayBuffer());
  }
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  });
}
