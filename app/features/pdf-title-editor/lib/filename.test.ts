import { describe, expect, it } from 'vitest';
import {
  fileNameFromTitle,
  resolveDuplicateNames,
  titleFromFileName,
} from './filename';

describe('title and filename conversion', () => {
  it('derives a title by dropping the extension only', () => {
    expect(titleFromFileName('2026 決算報告.pdf')).toBe('2026 決算報告');
    expect(titleFromFileName('notes.pdf.pdf')).toBe('notes.pdf');
  });

  it('derives a safe filename from a title', () => {
    expect(fileNameFromTitle('Q1/Q2 Report', 'original.pdf')).toBe(
      'Q1-Q2 Report.pdf',
    );
  });
});

describe('resolveDuplicateNames', () => {
  it('leaves unique names alone', () => {
    expect(resolveDuplicateNames(['a.pdf', 'b.pdf'])).toEqual([
      'a.pdf',
      'b.pdf',
    ]);
  });

  it('numbers duplicates from 2 in input order', () => {
    expect(resolveDuplicateNames(['a.pdf', 'a.pdf', 'a.pdf'])).toEqual([
      'a.pdf',
      'a (2).pdf',
      'a (3).pdf',
    ]);
  });

  it('treats names that differ only by case as duplicates', () => {
    expect(resolveDuplicateNames(['A.pdf', 'a.pdf'])).toEqual([
      'A.pdf',
      'a (2).pdf',
    ]);
  });

  it('does not collide with a name that already looks numbered', () => {
    expect(resolveDuplicateNames(['a.pdf', 'a (2).pdf', 'a.pdf'])).toEqual([
      'a.pdf',
      'a (2).pdf',
      'a (3).pdf',
    ]);
  });
});
