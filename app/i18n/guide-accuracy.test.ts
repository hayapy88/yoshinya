import { describe, expect, it } from 'vitest';
import { en } from './en';
import { ja } from './ja';
import type { Dictionary } from './locale';

// The guides tell people which buttons to press. When a label is reworded, the
// guide silently becomes wrong — nothing else in the suite would notice, and a
// user following stale instructions looks for a control that is not there.
// These tests pin every button name a guide quotes to the string the UI
// actually renders.

function guideText(dictionary: Dictionary, key: keyof Dictionary): string {
  const guide = dictionary[key] as {
    sections: {
      body?: string;
      steps?: string[];
      items?: string[];
      terms?: { definition: string }[];
    }[];
    faq: { answer: string }[];
  };
  const parts: string[] = [];
  for (const section of guide.sections) {
    if (section.body) parts.push(section.body);
    parts.push(...(section.steps ?? []), ...(section.items ?? []));
    parts.push(...(section.terms ?? []).map((t) => t.definition));
  }
  parts.push(...guide.faq.map((entry) => entry.answer));
  return parts.join('\n');
}

describe.each([
  ['en', en],
  ['ja', ja],
])('%s guides quote labels the UI actually renders', (_locale, t) => {
  it('file renamer names the download button correctly', () => {
    const text = guideText(t, 'fileRenamerGuide');
    expect(text).toContain(t.download.confirm);
  });

  it('file renamer names its tokens correctly', () => {
    const text = guideText(t, 'fileRenamerGuide');
    for (const token of [
      t.tokens.text,
      t.tokens.separator,
      t.tokens.date,
      t.tokens.time,
      t.tokens.index,
      t.tokens.dimensions,
    ]) {
      expect(text).toContain(token);
    }
  });

  it('image sorter names the buttons it tells people to press', () => {
    const text = guideText(t, 'imageSorterGuide');
    for (const label of [
      t.imageSorter.startSorting,
      t.imageSorter.goToReview,
      t.imageSorter.download,
      t.imageSorter.unsortedLabel,
    ]) {
      expect(text).toContain(label);
    }
  });

  it('pdf title editor names the buttons it tells people to press', () => {
    const text = guideText(t, 'pdfTitleEditorGuide');
    for (const label of [
      t.pdfTitleEditor.otherMetadata,
      t.pdfTitleEditor.batchHeading,
      t.pdfTitleEditor.createAndDownload,
      t.pdfTitleEditor.createAll,
    ]) {
      expect(text).toContain(label);
    }
  });

  it('csv encoding fixer names the button it tells people to press', () => {
    const text = guideText(t, 'csvEncodingFixerGuide');
    expect(text).toContain(t.csvEncodingFixer.download);
  });

  it('pdf merger names the controls it tells people to press', () => {
    const text = guideText(t, 'pdfMergerGuide');
    for (const label of [
      t.pdfMerger.sortByName,
      t.pdfMerger.reverse,
      t.pdfMerger.pageRangeLabel,
      t.pdfMerger.merge,
    ]) {
      expect(text).toContain(label);
    }
  });

  it('icon generator names the controls it tells people to press', () => {
    const text = guideText(t, 'iconGeneratorGuide');
    for (const label of [
      t.iconGenerator.selectAll,
      t.iconGenerator.copySvg,
      t.iconGenerator.exportHeading,
    ]) {
      expect(text).toContain(label);
    }
  });
});

const ALL_GUIDES = [
  'fileRenamerGuide',
  'imageSorterGuide',
  'pdfTitleEditorGuide',
  'csvEncodingFixerGuide',
  'splitBillGuide',
  'iconGeneratorGuide',
  'pdfMergerGuide',
] as const;

describe('every guide has the same shape in both locales', () => {
  it.each(ALL_GUIDES)('%s has matching section and FAQ counts', (key) => {
    const enGuide = en[key];
    const jaGuide = ja[key];
    expect(jaGuide.sections).toHaveLength(enGuide.sections.length);
    expect(jaGuide.faq).toHaveLength(enGuide.faq.length);
  });

  it.each(ALL_GUIDES)('%s uses the shared headings', (key) => {
    expect(en[key].faqHeading).toBe('Frequently asked questions');
    expect(en[key].relatedHeading).toBe('Related tools');
    const headings = en[key].sections.map((section) => section.heading);
    expect(headings).toContain('How to use the tool');
    expect(headings).toContain('When is it useful?');
    expect(headings.at(-1)).toBe('Privacy and security');
  });
});

describe('a guide opens with what the visitor came for', () => {
  // The steps and the cases come first, then anything tool-specific. Someone
  // landing on a tool page wants to use it, not to read about it, and a guide
  // that opens with an explanation buries the instructions below the fold.
  //
  // Every tool follows this, with no exceptions to remember.
  it.each(ALL_GUIDES)('%s leads with the steps and the cases', (key) => {
    expect(en[key].sections.slice(0, 2).map((s) => s.heading)).toEqual([
      'How to use the tool',
      'When is it useful?',
    ]);
    expect(ja[key].sections.slice(0, 2).map((s) => s.heading)).toEqual([
      '使い方',
      'こんなときに便利',
    ]);
  });
});
