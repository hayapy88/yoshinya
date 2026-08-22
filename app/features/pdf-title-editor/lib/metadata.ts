import { LIMITS, type PdfMetadataForm } from './types';

// Keywords are stored in the PDF as one free-text string. Commas are the most
// common convention (and what Acrobat writes), but semicolons show up often
// enough to accept on the way in.
const KEYWORD_SPLIT = /[,;]/;
export const KEYWORD_JOIN = ', ';

export function parseKeywords(raw: string): string[] {
  return raw
    .split(KEYWORD_SPLIT)
    .map((keyword) => normalizeTextField(keyword))
    .filter((keyword) => keyword !== '')
    .slice(0, LIMITS.maxKeywords);
}

export function formatKeywords(keywords: string[]): string {
  return keywords.join(KEYWORD_JOIN);
}

// Applied on every keystroke: line breaks and tabs would survive into a browser
// tab title as stray whitespace, so collapse them. Deliberately does not trim —
// doing that while typing would swallow the space before the next word.
export function sanitizeInput(value: string): string {
  return value.replace(/\s+/g, ' ').slice(0, LIMITS.maxTextLength);
}

// Applied when reading from and writing to a PDF, where trailing whitespace is
// never what the user meant.
export function normalizeTextField(value: string): string {
  return sanitizeInput(value).trim();
}

export function emptyMetadata(): PdfMetadataForm {
  return { title: '', author: '', subject: '', keywords: [] };
}

export function metadataEquals(
  a: PdfMetadataForm,
  b: PdfMetadataForm,
): boolean {
  return (
    a.title === b.title &&
    a.author === b.author &&
    a.subject === b.subject &&
    a.keywords.length === b.keywords.length &&
    a.keywords.every((keyword, index) => keyword === b.keywords[index])
  );
}
