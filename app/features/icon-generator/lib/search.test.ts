import { describe, expect, it } from 'vitest';
import { filterIcons, type IconLabel } from './search';
import type { IconDefinition } from './icon-data';

const icons: IconDefinition[] = [
  {
    id: 'house',
    category: 'basic',
    markup: '<path d="M1 1"/>',
    tags: ['home', 'building'],
  },
  {
    id: 'trash-2',
    category: 'action',
    markup: '<path d="M2 2"/>',
    tags: ['delete', 'bin'],
  },
  {
    id: 'mail',
    category: 'contact',
    markup: '<path d="M3 3"/>',
    tags: ['email', 'envelope'],
  },
];

const labels: Record<string, IconLabel> = {
  house: { name: 'ホーム', keywords: '家 住宅 トップ' },
  'trash-2': { name: 'ゴミ箱', keywords: '削除 捨てる' },
  mail: { name: 'メール', keywords: '封筒 手紙 連絡' },
};

const ids = (result: IconDefinition[]) => result.map((icon) => icon.id);

describe('filterIcons', () => {
  it('returns everything for an empty query', () => {
    expect(filterIcons(icons, '', 'all', labels)).toHaveLength(3);
    expect(filterIcons(icons, '   ', 'all', labels)).toHaveLength(3);
  });

  it('matches the localized name', () => {
    expect(ids(filterIcons(icons, 'ゴミ箱', 'all', labels))).toEqual(['trash-2']);
  });

  // The point of the keyword list: nobody guesses that the house icon is
  // filed under 「ホーム」 when the word in their head is 「家」.
  it('matches a localized keyword the name does not contain', () => {
    expect(ids(filterIcons(icons, '家', 'all', labels))).toEqual(['house']);
  });

  it('matches the English id and the English tags', () => {
    expect(ids(filterIcons(icons, 'trash', 'all', labels))).toEqual(['trash-2']);
    expect(ids(filterIcons(icons, 'envelope', 'all', labels))).toEqual(['mail']);
  });

  it('ignores case', () => {
    expect(ids(filterIcons(icons, 'HOME', 'all', labels))).toEqual(['house']);
  });

  it('treats several words as conditions to meet together', () => {
    expect(ids(filterIcons(icons, 'house home', 'all', labels))).toEqual([
      'house',
    ]);
    expect(filterIcons(icons, 'house mail', 'all', labels)).toHaveLength(0);
  });

  // A Japanese keyboard inserts this space without the user noticing.
  it('splits on the ideographic space as well', () => {
    expect(ids(filterIcons(icons, '家　住宅', 'all', labels))).toEqual(['house']);
  });

  it('narrows by category', () => {
    expect(ids(filterIcons(icons, '', 'contact', labels))).toEqual(['mail']);
  });

  it('applies the category and the query together', () => {
    expect(filterIcons(icons, 'home', 'contact', labels)).toHaveLength(0);
  });

  it('does not fall over when an icon has no label yet', () => {
    expect(filterIcons(icons, 'house', 'all', {})).toHaveLength(1);
  });
});
