import { describe, expect, it } from 'vitest';
import { splitFileName, splitZipName } from './filename';

describe('splitFileName', () => {
  it('numbers to the width of the total, so a file manager sorts them right', () => {
    expect(splitFileName('report.pdf', 2, 9)).toBe('report-2.pdf');
    expect(splitFileName('report.pdf', 2, 12)).toBe('report-02.pdf');
    expect(splitFileName('report.pdf', 12, 12)).toBe('report-12.pdf');
    expect(splitFileName('report.pdf', 7, 100)).toBe('report-007.pdf');
  });

  it('does not double the extension', () => {
    expect(splitFileName('report', 1, 1)).toBe('report-1.pdf');
    expect(splitFileName('report.PDF', 1, 1)).toBe('report-1.pdf');
  });

  it('keeps a Japanese file name intact', () => {
    expect(splitFileName('請求書.pdf', 3, 10)).toBe('請求書-03.pdf');
  });
});

describe('splitZipName', () => {
  it('names the zip after the output', () => {
    expect(splitZipName('report.pdf')).toBe('report-split.zip');
    expect(splitZipName('請求書.pdf')).toBe('請求書-split.zip');
  });
});
