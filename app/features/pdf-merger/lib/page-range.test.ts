import { describe, expect, it } from 'vitest';
import { parsePageRange } from './page-range';

const pages = (input: string, pageCount = 12) => {
  const result = parsePageRange(input, pageCount);
  if (!result.ok) {
    throw new Error(`expected a parse, got ${result.error}`);
  }
  return result.pages;
};

const error = (input: string, pageCount = 12) => {
  const result = parsePageRange(input, pageCount);
  if (result.ok) {
    throw new Error(`expected an error, got [${result.pages.join(',')}]`);
  }
  return result.error;
};

describe('parsePageRange', () => {
  it('treats an empty expression as every page', () => {
    expect(pages('', 3)).toEqual([0, 1, 2]);
    expect(pages('   ', 3)).toEqual([0, 1, 2]);
  });

  it('returns 0-based indices for 1-based input', () => {
    expect(pages('1')).toEqual([0]);
    expect(pages('3')).toEqual([2]);
  });

  it('expands a closed span', () => {
    expect(pages('1-5')).toEqual([0, 1, 2, 3, 4]);
  });

  it('expands a list', () => {
    expect(pages('2,5,7')).toEqual([1, 4, 6]);
  });

  it('runs an open-ended span to the last page', () => {
    expect(pages('10-', 12)).toEqual([9, 10, 11]);
  });

  it('runs an open-started span from the first page', () => {
    expect(pages('-3')).toEqual([0, 1, 2]);
  });

  it('reads a descending span as a reversal', () => {
    expect(pages('5-2')).toEqual([4, 3, 2, 1]);
  });

  it('keeps duplicates, so a cover page can be repeated', () => {
    expect(pages('1,1,2')).toEqual([0, 0, 1]);
  });

  it('keeps the order the user wrote', () => {
    expect(pages('3,1')).toEqual([2, 0]);
  });

  it('combines spans and singles', () => {
    expect(pages('1-2,5,9-11')).toEqual([0, 1, 4, 8, 9, 10]);
  });

  it('accepts spaces around the separators', () => {
    expect(pages(' 1 - 2 , 5 ')).toEqual([0, 1, 4]);
  });

  it('accepts full-width digits and punctuation', () => {
    expect(pages('１−３，５')).toEqual([0, 1, 2, 4]);
    expect(pages('２、４')).toEqual([1, 3]);
  });

  it('rejects a page number past the end', () => {
    expect(error('13')).toBe('range_out_of_bounds');
    expect(error('10-13')).toBe('range_out_of_bounds');
  });

  it('rejects page zero rather than reading it as an index', () => {
    expect(error('0')).toBe('range_out_of_bounds');
  });

  it('rejects expressions it cannot read', () => {
    expect(error('abc')).toBe('range_invalid');
    expect(error('1--2')).toBe('range_invalid');
    expect(error(',')).toBe('range_invalid');
    expect(error('1,')).toBe('range_invalid');
    expect(error('1-2-3')).toBe('range_invalid');
  });

  it('rejects a bare dash instead of guessing it means everything', () => {
    expect(error('-')).toBe('range_invalid');
  });
});
