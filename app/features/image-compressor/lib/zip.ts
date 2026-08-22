import JSZip from 'jszip';

export type ZipEntry = { name: string; blob: Blob };

/**
 * Store, not deflate. These are already-compressed image formats, so deflating
 * them costs seconds on a large batch and saves close to nothing — and the
 * saving would come out of the very bytes the tool just worked to reduce.
 */
export function createImageZip(
  entries: ZipEntry[],
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  for (const { name, blob } of entries) {
    zip.file(name, blob);
  }
  return zip.generateAsync({ type: 'blob', compression: 'STORE' }, (meta) =>
    onProgress?.(meta.percent),
  );
}

export function zipFileName(): string {
  return 'yoshinya-compressed-images.zip';
}
