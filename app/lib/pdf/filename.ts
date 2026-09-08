// File-name handling shared by every PDF tool. Lives outside the feature
// folders because two tools resolving download names differently is a bug
// waiting to be reported against only one of them.

// Characters that are illegal in file names on Windows and awkward everywhere
// else, plus control characters that can smuggle line breaks into a name.
const INVALID_CHARS = /[/\\:*?"<>|]/g;
// Matching control characters is the point here: they must never survive into
// a file name.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export function sanitizeFileName(name: string): string {
  return (
    name
      .replace(CONTROL_CHARS, '')
      .replace(INVALID_CHARS, '-')
      .replace(/\s+/g, ' ')
      .trim()
      // Windows silently drops trailing dots and spaces, which would turn
      // "report .pdf" into a name the user never asked for.
      .replace(/[. ]+$/, '')
  );
}

export function hasPdfExtension(name: string): boolean {
  return /\.pdf$/i.test(name);
}

export function ensurePdfExtension(name: string): string {
  return hasPdfExtension(name) ? name : `${name}.pdf`;
}

// Removes only the final .pdf, so "report.v2.pdf" becomes "report.v2".
export function stripPdfExtension(name: string): string {
  return name.replace(/\.pdf$/i, '');
}

// Resolves what the download is actually called: falls back to the original
// name when the field was emptied, sanitises, and guarantees the extension.
export function resolveOutputName(raw: string, fallback: string): string {
  const sanitized = stripPdfExtension(sanitizeFileName(raw));
  const base =
    sanitized === ''
      ? stripPdfExtension(sanitizeFileName(fallback))
      : sanitized;
  return ensurePdfExtension(base === '' ? 'document' : base);
}
