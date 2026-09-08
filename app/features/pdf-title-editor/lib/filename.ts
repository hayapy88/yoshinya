import { resolveOutputName, stripPdfExtension } from '~/lib/pdf/filename';

// The generic PDF file-name helpers live in ~/lib/pdf/filename and are shared
// with the other PDF tools. What stays here is specific to this one: the
// two-way mapping between a document's Title and its file name, and the ZIP
// naming that only a batch download needs.

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
