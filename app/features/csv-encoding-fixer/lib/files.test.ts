import { describe, expect, it } from 'vitest';
import { classify, fixedFileName, LIMITS } from './files';

const file = (name: string, size: number) => {
  const f = new File(['x'], name, { type: 'text/csv' });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

let counter = 0;
const newId = () => `id-${(counter += 1)}`;

describe('classify', () => {
  it('accepts ordinary files', () => {
    const { accepted, rejected } = classify([file('a.csv', 100)], 0, newId);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(0);
  });

  it('rejects an empty file rather than reporting it as UTF-8', () => {
    const { rejected } = classify([file('a.csv', 0)], 0, newId);
    expect(rejected[0].errorCode).toBe('empty_file');
  });

  it('rejects a file over the size limit', () => {
    const { rejected } = classify(
      [file('a.csv', LIMITS.maxBytes + 1)],
      0,
      newId,
    );
    expect(rejected[0].errorCode).toBe('file_too_large');
  });

  // A second drop has to count what is already loaded, or the limit only
  // applies to whichever batch happens to be first.
  it('counts files already loaded against the limit', () => {
    const { accepted, rejected } = classify(
      [file('a.csv', 10), file('b.csv', 10)],
      LIMITS.maxFiles - 1,
      newId,
    );
    expect(accepted).toHaveLength(1);
    expect(rejected[0].errorCode).toBe('too_many_files');
  });

  it('keeps the good files when one in the batch is rejected', () => {
    const { accepted, rejected } = classify(
      [file('bad.csv', 0), file('good.csv', 10)],
      0,
      newId,
    );
    expect(accepted.map((f) => f.name)).toEqual(['good.csv']);
    expect(rejected).toHaveLength(1);
  });
});

describe('fixedFileName', () => {
  it('marks the copy so it is not mistaken for the original', () => {
    expect(fixedFileName('売上.csv')).toBe('売上_utf8.csv');
  });

  it('keeps a multi-dot name intact', () => {
    expect(fixedFileName('2026.04.売上.csv')).toBe('2026.04.売上_utf8.csv');
  });

  it('handles a name with no extension', () => {
    expect(fixedFileName('export')).toBe('export_utf8');
  });

  it('does not treat a leading dot as an extension', () => {
    expect(fixedFileName('.hidden')).toBe('.hidden_utf8');
  });
});
