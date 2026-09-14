import type { PageItem, Segment } from './types';

/**
 * Turns the boundaries the user clicked between pages into the runs of pages
 * that become files.
 *
 * A boundary is the index of the page that starts a new file, so 3 means "cut
 * before the fourth page". Boundaries at the very start or past the end are
 * dropped rather than rejected: they would produce a file with no pages in it,
 * and a click that lands on the edge of the grid is an accident, not an intent.
 */
export function boundariesToSegments(
  pageCount: number,
  boundaries: Iterable<number>,
): Segment[] {
  if (pageCount <= 0) {
    return [];
  }
  const cuts = [...new Set(boundaries)]
    .filter((index) => index > 0 && index < pageCount)
    .sort((a, b) => a - b);

  const segments: Segment[] = [];
  let start = 0;
  for (const cut of cuts) {
    segments.push({ start, end: cut });
    start = cut;
  }
  segments.push({ start, end: pageCount });
  return segments;
}

/** Fixed-size runs: 1 gives a file per page, which is the common request. */
export function everyNSegments(pageCount: number, size: number): Segment[] {
  if (pageCount <= 0 || !Number.isInteger(size) || size < 1) {
    return [];
  }
  const segments: Segment[] = [];
  for (let start = 0; start < pageCount; start += size) {
    segments.push({ start, end: Math.min(start + size, pageCount) });
  }
  return segments;
}

/**
 * Each selected page starts a new file. This is the shape of the job it exists
 * for: fifty invoices in one scan, where the user selects each invoice's first
 * page and expects fifty files.
 */
export function segmentsFromSelection(
  pages: PageItem[],
  selected: Iterable<string>,
): Segment[] {
  const target = new Set(selected);
  const boundaries = pages.reduce<number[]>((cuts, page, index) => {
    if (target.has(page.id)) {
      cuts.push(index);
    }
    return cuts;
  }, []);
  return boundariesToSegments(pages.length, boundaries);
}

/**
 * "1-3 / 4-8 / 9-12", in the page numbers the user is looking at. Shown before
 * the download so a wrong cut is visible while it can still be fixed.
 */
export function describeSegments(segments: Segment[]): string {
  return segments
    .map(({ start, end }) =>
      end - start === 1 ? `${start + 1}` : `${start + 1}-${end}`,
    )
    .join(' / ');
}
