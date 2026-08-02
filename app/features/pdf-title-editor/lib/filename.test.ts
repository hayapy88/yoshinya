import { describe, expect, it } from 'vitest'
import {
  ensurePdfExtension,
  fileNameFromTitle,
  resolveDuplicateNames,
  resolveOutputName,
  sanitizeFileName,
  stripPdfExtension,
  titleFromFileName,
} from './filename'

describe('sanitizeFileName', () => {
  it('replaces characters that are illegal on Windows', () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe(
      'a-b-c-d-e-f-g-h-i-j',
    )
  })

  it('strips control characters instead of turning them into dashes', () => {
    const withControlChars = "re" + String.fromCharCode(0) + "po" + String.fromCharCode(31) + "rt"
    expect(sanitizeFileName(withControlChars)).toBe('report')
  })

  it('collapses whitespace and trims trailing dots and spaces', () => {
    expect(sanitizeFileName('  annual   report .  ')).toBe('annual report')
  })

  it('keeps Japanese characters', () => {
    expect(sanitizeFileName('決算報告 2026')).toBe('決算報告 2026')
  })
})

describe('extension handling', () => {
  it('appends .pdf only when missing', () => {
    expect(ensurePdfExtension('report')).toBe('report.pdf')
    expect(ensurePdfExtension('report.pdf')).toBe('report.pdf')
    expect(ensurePdfExtension('report.PDF')).toBe('report.PDF')
  })

  it('removes only the final .pdf', () => {
    expect(stripPdfExtension('report.v2.pdf')).toBe('report.v2')
    expect(stripPdfExtension('report.pdf.pdf')).toBe('report.pdf')
  })
})

describe('resolveOutputName', () => {
  it('falls back to the original name when the field is blank', () => {
    expect(resolveOutputName('', 'original.pdf')).toBe('original.pdf')
    expect(resolveOutputName('   ', 'original.pdf')).toBe('original.pdf')
  })

  it('sanitises and adds the extension', () => {
    expect(resolveOutputName('a/b', 'original.pdf')).toBe('a-b.pdf')
  })

  it('does not double the extension', () => {
    expect(resolveOutputName('report.pdf', 'original.pdf')).toBe('report.pdf')
  })

  it('turns illegal characters into dashes rather than dropping the name', () => {
    expect(resolveOutputName('///', 'original.pdf')).toBe('---.pdf')
  })

  it('falls back to a generic name when both the input and fallback are blank', () => {
    expect(resolveOutputName('   ', '   ')).toBe('document.pdf')
  })
})

describe('title and filename conversion', () => {
  it('derives a title by dropping the extension only', () => {
    expect(titleFromFileName('2026 決算報告.pdf')).toBe('2026 決算報告')
    expect(titleFromFileName('notes.pdf.pdf')).toBe('notes.pdf')
  })

  it('derives a safe filename from a title', () => {
    expect(fileNameFromTitle('Q1/Q2 Report', 'original.pdf')).toBe(
      'Q1-Q2 Report.pdf',
    )
  })
})

describe('resolveDuplicateNames', () => {
  it('leaves unique names alone', () => {
    expect(resolveDuplicateNames(['a.pdf', 'b.pdf'])).toEqual([
      'a.pdf',
      'b.pdf',
    ])
  })

  it('numbers duplicates from 2 in input order', () => {
    expect(
      resolveDuplicateNames(['a.pdf', 'a.pdf', 'a.pdf']),
    ).toEqual(['a.pdf', 'a (2).pdf', 'a (3).pdf'])
  })

  it('treats names that differ only by case as duplicates', () => {
    expect(resolveDuplicateNames(['A.pdf', 'a.pdf'])).toEqual([
      'A.pdf',
      'a (2).pdf',
    ])
  })

  it('does not collide with a name that already looks numbered', () => {
    expect(
      resolveDuplicateNames(['a.pdf', 'a (2).pdf', 'a.pdf']),
    ).toEqual(['a.pdf', 'a (2).pdf', 'a (3).pdf'])
  })
})
