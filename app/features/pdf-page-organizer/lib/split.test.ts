import { describe, expect, it } from 'vitest';
import {
  boundariesToSegments,
  describeSegments,
  everyNSegments,
  segmentsFromSelection,
} from './split';
import { createPages } from './pages';

const pages = (count: number) =>
  createPages(new Array(count).fill(0), (index) => `p${index}`);

describe('boundariesToSegments', () => {
  it('gives one file back when nothing is cut', () => {
    expect(boundariesToSegments(5, [])).toEqual([{ start: 0, end: 5 }]);
  });

  it('cuts before the page the boundary names', () => {
    expect(boundariesToSegments(6, [3])).toEqual([
      { start: 0, end: 3 },
      { start: 3, end: 6 },
    ]);
  });

  it('sorts and de-duplicates whatever order the cuts arrived in', () => {
    expect(boundariesToSegments(6, [4, 2, 4])).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
      { start: 4, end: 6 },
    ]);
  });

  it('ignores a cut at either edge, which would make an empty file', () => {
    expect(boundariesToSegments(4, [0, 4, 9])).toEqual([{ start: 0, end: 4 }]);
  });

  it('has nothing to split when there are no pages', () => {
    expect(boundariesToSegments(0, [1])).toEqual([]);
  });
});

describe('everyNSegments', () => {
  it('gives a file per page at a size of one', () => {
    expect(everyNSegments(3, 1)).toEqual([
      { start: 0, end: 1 },
      { start: 1, end: 2 },
      { start: 2, end: 3 },
    ]);
  });

  it('leaves the remainder in a shorter last file', () => {
    expect(everyNSegments(5, 2)).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
      { start: 4, end: 5 },
    ]);
  });

  it('gives one file when the size covers the whole document', () => {
    expect(everyNSegments(4, 10)).toEqual([{ start: 0, end: 4 }]);
  });

  it('refuses a size that is not a whole number of pages', () => {
    expect(everyNSegments(4, 0)).toEqual([]);
    expect(everyNSegments(4, -2)).toEqual([]);
    expect(everyNSegments(4, 1.5)).toEqual([]);
  });
});

describe('segmentsFromSelection', () => {
  it('starts a new file at each selected page', () => {
    expect(segmentsFromSelection(pages(6), ['p2', 'p4'])).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
      { start: 4, end: 6 },
    ]);
  });

  it('still starts the first file at page one when page one is selected', () => {
    expect(segmentsFromSelection(pages(4), ['p0', 'p2'])).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ]);
  });

  it('gives one file when nothing is selected', () => {
    expect(segmentsFromSelection(pages(3), [])).toEqual([{ start: 0, end: 3 }]);
  });
});

describe('describeSegments', () => {
  it('reads in the page numbers on the cards', () => {
    expect(
      describeSegments([
        { start: 0, end: 3 },
        { start: 3, end: 8 },
      ]),
    ).toBe('1-3 / 4-8');
  });

  it('writes a single page as one number', () => {
    expect(
      describeSegments([
        { start: 0, end: 1 },
        { start: 1, end: 2 },
      ]),
    ).toBe('1 / 2');
  });
});
