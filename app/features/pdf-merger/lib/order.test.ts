import { describe, expect, it } from 'vitest';
import { moveItem, reverse, sortByName } from './order';

const items = (...names: string[]) => names.map((fileName) => ({ fileName }));
const names = (list: { fileName: string }[]) => list.map((i) => i.fileName);

describe('sortByName', () => {
  it('sorts unpadded numbers the way a file manager does', () => {
    expect(names(sortByName(items('10.pdf', '2.pdf', '1.pdf')))).toEqual([
      '1.pdf',
      '2.pdf',
      '10.pdf',
    ]);
  });

  it('ignores case', () => {
    expect(names(sortByName(items('b.pdf', 'A.pdf')))).toEqual([
      'A.pdf',
      'b.pdf',
    ]);
  });

  it('sorts numbered Japanese names naturally', () => {
    expect(
      names(sortByName(items('請求書-10.pdf', '請求書-2.pdf'))),
    ).toEqual(['請求書-2.pdf', '請求書-10.pdf']);
  });

  it('does not mutate the input', () => {
    const input = items('b.pdf', 'a.pdf');
    sortByName(input);
    expect(names(input)).toEqual(['b.pdf', 'a.pdf']);
  });
});

describe('reverse', () => {
  it('reverses without mutating the input', () => {
    const input = items('a.pdf', 'b.pdf', 'c.pdf');
    expect(names(reverse(input))).toEqual(['c.pdf', 'b.pdf', 'a.pdf']);
    expect(names(input)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
  });
});

describe('moveItem', () => {
  const list = ['a', 'b', 'c', 'd'];

  it('moves an item forward', () => {
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item backward', () => {
    expect(moveItem(list, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('clamps a target past the end instead of dropping the item', () => {
    expect(moveItem(list, 0, 99)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('clamps a negative target', () => {
    expect(moveItem(list, 2, -5)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('returns the same list when nothing would move', () => {
    expect(moveItem(list, 1, 1)).toBe(list);
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 3, 99)).toBe(list);
  });

  it('ignores an out-of-range source', () => {
    expect(moveItem(list, 9, 0)).toBe(list);
    expect(moveItem(list, -1, 0)).toBe(list);
  });

  it('does not mutate the input', () => {
    moveItem(list, 0, 3);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
  });
});
