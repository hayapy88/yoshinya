import { describe, expect, it } from 'vitest';
import {
  applyBatch,
  applyFileNameFromTitle,
  applyTitleFromFileName,
  changedFields,
  countAffected,
  currentMetadata,
  resetItem,
  withField,
  withOutputName,
} from './edits';
import type { PdfItem, PdfMetadataForm } from './types';

const metadata = (over: Partial<PdfMetadataForm> = {}): PdfMetadataForm => ({
  title: '',
  author: '',
  subject: '',
  keywords: [],
  ...over,
});

const item = (over: Partial<PdfItem> = {}): PdfItem => {
  const original = over.originalMetadata ?? metadata();
  return {
    id: 'a',
    sourceFile: new File([], 'a.pdf'),
    originalFileName: 'a.pdf',
    outputFileName: 'a.pdf',
    size: 10,
    pageCount: 1,
    originalMetadata: original,
    editedMetadata: original,
    status: 'ready',
    ...over,
  };
};

const failed = () =>
  item({ status: 'error', errorCode: 'corrupted', editedMetadata: undefined });

describe('withField', () => {
  it('marks the item as modified', () => {
    expect(withField(item(), 'title', 'New').status).toBe('modified');
  });

  it('returns to ready when edited back to the original value', () => {
    const original = metadata({ title: 'Original' });
    const edited = withField(
      item({ originalMetadata: original }),
      'title',
      'Changed',
    );
    expect(withField(edited, 'title', 'Original').status).toBe('ready');
  });

  it('parses keywords from a comma-separated string', () => {
    const next = withField(item(), 'keywords', 'a, b');
    expect(currentMetadata(next).keywords).toEqual(['a', 'b']);
  });

  it('normalises line breaks out of text fields', () => {
    const next = withField(item(), 'title', 'one\ntwo');
    expect(currentMetadata(next).title).toBe('one two');
  });

  it('leaves a failed item untouched', () => {
    const broken = failed();
    expect(withField(broken, 'title', 'x')).toBe(broken);
  });

  it('discards a previously generated output so it cannot be re-downloaded stale', () => {
    const withBlob = item({ outputBlob: new Blob(['x']) });
    expect(withField(withBlob, 'title', 'x').outputBlob).toBeUndefined();
  });
});

describe('changedFields', () => {
  const original = metadata({
    title: 'Original',
    author: 'A',
    keywords: ['x'],
  });
  const base = () => item({ originalMetadata: original });

  it('is empty for an untouched item', () => {
    expect(changedFields(base()).size).toBe(0);
  });

  it('names only the field that changed', () => {
    const next = withField(base(), 'title', 'Changed');
    expect([...changedFields(next)]).toEqual(['title']);
  });

  it('tracks several fields at once', () => {
    const next = withField(withField(base(), 'title', 'X'), 'author', 'Y');
    expect(changedFields(next)).toEqual(new Set(['title', 'author']));
  });

  it('flags the output filename separately from the metadata', () => {
    const next = withOutputName(base(), 'renamed.pdf');
    expect([...changedFields(next)]).toEqual(['outputFileName']);
  });

  it('detects a keyword change', () => {
    const next = withField(base(), 'keywords', 'x, y');
    expect([...changedFields(next)]).toEqual(['keywords']);
  });

  it('ignores trailing whitespace typed mid-edit', () => {
    const next = withField(base(), 'title', 'Original ');
    expect(changedFields(next).size).toBe(0);
    expect(next.status).toBe('ready');
  });

  it('stays empty for an item that failed to load', () => {
    expect(changedFields(failed()).size).toBe(0);
  });

  it('agrees with the card status', () => {
    const next = withField(base(), 'subject', 'New subject');
    expect(next.status).toBe('modified');
    expect(changedFields(next).has('subject')).toBe(true);
  });
});

describe('withOutputName', () => {
  it('sanitises and keeps the extension', () => {
    expect(withOutputName(item(), 'a/b').outputFileName).toBe('a-b.pdf');
  });

  it('falls back to the original name when blanked', () => {
    expect(withOutputName(item(), '').outputFileName).toBe('a.pdf');
  });

  it('a blank field is not treated as a modification', () => {
    expect(withOutputName(item(), '').status).toBe('ready');
  });
});

describe('resetItem', () => {
  it('restores metadata and the output name', () => {
    const original = metadata({ title: 'Original' });
    const edited = withOutputName(
      withField(item({ originalMetadata: original }), 'title', 'Changed'),
      'other.pdf',
    );
    const reset = resetItem(edited);
    expect(currentMetadata(reset).title).toBe('Original');
    expect(reset.outputFileName).toBe('a.pdf');
    expect(reset.status).toBe('ready');
  });
});

describe('batch application', () => {
  const items = () => [
    item({ id: '1', originalMetadata: metadata({ author: 'Set' }) }),
    item({ id: '2', originalMetadata: metadata() }),
    failed(),
  ];

  it('applies to every editable item in "all" mode', () => {
    const next = applyBatch(items(), 'author', 'Yoshinya', 'all');
    expect(currentMetadata(next[0]!).author).toBe('Yoshinya');
    expect(currentMetadata(next[1]!).author).toBe('Yoshinya');
  });

  it('applies only to blank fields in "blank" mode', () => {
    const next = applyBatch(items(), 'author', 'Yoshinya', 'blank');
    expect(currentMetadata(next[0]!).author).toBe('Set');
    expect(currentMetadata(next[1]!).author).toBe('Yoshinya');
  });

  it('never touches a failed item', () => {
    const next = applyBatch(items(), 'author', 'Yoshinya', 'all');
    expect(next[2]!.status).toBe('error');
    expect(next[2]!.editedMetadata).toBeUndefined();
  });

  it('counts affected items per mode, excluding failures', () => {
    expect(countAffected(items(), 'author', 'all')).toBe(2);
    expect(countAffected(items(), 'author', 'blank')).toBe(1);
  });
});

describe('title and filename batch actions', () => {
  it('uses the filename as the title without the extension', () => {
    const next = applyTitleFromFileName([
      item({ originalFileName: '2026 決算報告.pdf' }),
    ]);
    expect(currentMetadata(next[0]!).title).toBe('2026 決算報告');
  });

  it('uses the title as the filename, sanitised', () => {
    const source = withField(item(), 'title', 'Q1/Q2 Report');
    const next = applyFileNameFromTitle([source]);
    expect(next[0]!.outputFileName).toBe('Q1-Q2 Report.pdf');
  });

  it('leaves the filename alone when the title is blank', () => {
    const next = applyFileNameFromTitle([item()]);
    expect(next[0]!.outputFileName).toBe('a.pdf');
  });
});
