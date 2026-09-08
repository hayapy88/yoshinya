export type PageRangeError = 'range_invalid' | 'range_out_of_bounds';

export type PageRangeResult =
  | { ok: true; pages: number[] }
  | { ok: false; error: PageRangeError };

// Japanese keyboards produce full-width digits and punctuation without the user
// noticing, and a tool that rejects "１-３" for looking wrong is just broken.
// Normalising here means the parser below only ever sees ASCII.
function toAscii(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[，、]/g, ',')
    .replace(/[－ー−–—〜～]/g, '-')
    .replace(/　/g, ' ');
}

// Expands one clause into 1-based page numbers. Returns null when the clause is
// not a shape we understand, which the caller turns into range_invalid.
function expandClause(clause: string, pageCount: number): number[] | null {
  const single = /^(\d+)$/.exec(clause);
  if (single) {
    return [Number(single[1])];
  }
  const span = /^(\d*)-(\d*)$/.exec(clause);
  if (!span) {
    return null;
  }
  const [, rawStart, rawEnd] = span;
  // "-" on its own carries no information; treating it as "everything" would
  // guess at an intent the user never expressed.
  if (rawStart === '' && rawEnd === '') {
    return null;
  }
  const start = rawStart === '' ? 1 : Number(rawStart);
  const end = rawEnd === '' ? pageCount : Number(rawEnd);
  const step = start <= end ? 1 : -1;
  const pages: number[] = [];
  for (let page = start; step > 0 ? page <= end : page >= end; page += step) {
    pages.push(page);
  }
  return pages;
}

/**
 * Turns a page-range expression into 0-based page indices, in the order the
 * user wrote them.
 *
 * An empty expression means every page — that is the default, and the reason
 * the tool works without anyone touching this field.
 *
 * Two things are deliberately preserved rather than tidied up:
 * duplicates ("1,1,2" really does insert the cover twice, which is how you
 * repeat a title page) and order ("3,1" puts page 3 first). Collapsing either
 * would silently produce a document the user did not ask for.
 */
export function parsePageRange(
  input: string,
  pageCount: number,
): PageRangeResult {
  const normalized = toAscii(input).trim();
  if (normalized === '') {
    return { ok: true, pages: Array.from({ length: pageCount }, (_, i) => i) };
  }

  const pages: number[] = [];
  for (const raw of normalized.split(',')) {
    const clause = raw.replace(/\s+/g, '');
    if (clause === '') {
      return { ok: false, error: 'range_invalid' };
    }
    const expanded = expandClause(clause, pageCount);
    if (expanded === null) {
      return { ok: false, error: 'range_invalid' };
    }
    for (const page of expanded) {
      // Page 0 does not exist in the numbering the user reads off their viewer,
      // so it is out of bounds rather than a syntax problem.
      if (page < 1 || page > pageCount) {
        return { ok: false, error: 'range_out_of_bounds' };
      }
      pages.push(page - 1);
    }
  }

  return { ok: true, pages };
}
