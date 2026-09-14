import { ensurePdfExtension, stripPdfExtension } from '~/lib/pdf/filename';

/**
 * report.pdf, split into twelve, becomes report-01.pdf … report-12.pdf.
 *
 * The number is padded to the width of the total on purpose: report-1.pdf and
 * report-10.pdf sort next to each other in every file manager there is, which
 * puts the tenth file second in a folder the user is about to work through.
 */
export function splitFileName(
  outputName: string,
  index: number,
  total: number,
): string {
  const base = stripPdfExtension(outputName);
  const width = String(Math.max(total, 1)).length;
  return ensurePdfExtension(`${base}-${String(index).padStart(width, '0')}`);
}

/** The zip that carries a split: report.pdf becomes report-split.zip. */
export function splitZipName(outputName: string): string {
  return `${stripPdfExtension(outputName)}-split.zip`;
}
