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

export function titleFromFileName(fileName: string): string {
  return stripPdfExtension(fileName).trim();
}

export function fileNameFromTitle(title: string, fallback: string): string {
  return resolveOutputName(title, fallback);
}

// ZIP entries and most file systems collide case-insensitively, so compare that
// way and hand out "name (2).pdf" style suffixes in input order.
export function resolveDuplicateNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const base = stripPdfExtension(name);
    let candidate = name;
    let counter = 1;
    while (used.has(candidate.toLowerCase())) {
      counter += 1;
      candidate = `${base} (${counter}).pdf`;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}
