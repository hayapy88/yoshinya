import { describe, expect, it } from 'vitest';
import {
  formatKeywords,
  metadataEquals,
  normalizeTextField,
  parseKeywords,
} from './metadata';
import { LIMITS } from './types';

describe('parseKeywords', () => {
  it('splits on commas and trims surrounding whitespace', () => {
    expect(parseKeywords('  annual report ,  fiscal 2026 ')).toEqual([
      'annual report',
      'fiscal 2026',
    ]);
  });

  it('also accepts semicolons, which some PDF writers use', () => {
    expect(parseKeywords('a; b,c')).toEqual(['a', 'b', 'c']);
  });

  it('drops empty entries from trailing or doubled separators', () => {
    expect(parseKeywords('a,,b,')).toEqual(['a', 'b']);
  });

  it('returns nothing for a blank string', () => {
    expect(parseKeywords('')).toEqual([]);
    expect(parseKeywords('   ')).toEqual([]);
  });

  it('caps the number of keywords', () => {
    const many = Array.from(
      { length: LIMITS.maxKeywords + 20 },
      (_, i) => `k${i}`,
    );
    expect(parseKeywords(many.join(',')).length).toBe(LIMITS.maxKeywords);
  });

  it('round-trips through formatKeywords', () => {
    const keywords = ['annual report', 'fiscal 2026', '決算'];
    expect(parseKeywords(formatKeywords(keywords))).toEqual(keywords);
  });
});

describe('normalizeTextField', () => {
  it('collapses line breaks and tabs into single spaces', () => {
    expect(normalizeTextField('first\nsecond\tthird')).toBe(
      'first second third',
    );
  });

  it('trims the result', () => {
    expect(normalizeTextField('  padded  ')).toBe('padded');
  });

  it('caps the length', () => {
    expect(
      normalizeTextField('x'.repeat(LIMITS.maxTextLength + 50)).length,
    ).toBe(LIMITS.maxTextLength);
  });

  it('keeps emoji and Japanese intact', () => {
    expect(normalizeTextField('報告書 🐱')).toBe('報告書 🐱');
  });
});

describe('metadataEquals', () => {
  const base = {
    title: 't',
    author: 'a',
    subject: 's',
    keywords: ['x', 'y'],
  };

  it('is true for identical values', () => {
    expect(metadataEquals(base, { ...base, keywords: ['x', 'y'] })).toBe(true);
  });

  it('is false when a keyword differs', () => {
    expect(metadataEquals(base, { ...base, keywords: ['x', 'z'] })).toBe(false);
  });

  it('is false when keyword order differs', () => {
    expect(metadataEquals(base, { ...base, keywords: ['y', 'x'] })).toBe(false);
  });

  it('is false when a text field differs', () => {
    expect(metadataEquals(base, { ...base, title: 'other' })).toBe(false);
  });
});
