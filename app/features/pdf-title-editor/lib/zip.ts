// createPdfZip moved to ~/lib/pdf/zip when PDF Page Organizer needed the same
// zip: two copies of it would have drifted the moment one was changed. What is
// left here is the part that is genuinely this tool's own — its file name.

// yoshinya-pdf-title-editor-YYYYMMDD-HHmm.zip, per the spec.
export function zipFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `yoshinya-pdf-title-editor-${date}-${time}.zip`;
}
