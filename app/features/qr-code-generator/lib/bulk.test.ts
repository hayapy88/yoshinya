import { describe, expect, it } from 'vitest';
import { BULK_LIMIT, parseBulk, safeFileName } from './bulk';

describe('parseBulk', () => {
  it('makes one entry per line and numbers the unnamed ones', () => {
    const { entries } = parseBulk('https://a.example\nhttps://b.example');
    expect(entries).toEqual([
      { name: 'qr-1', value: 'https://a.example' },
      { name: 'qr-2', value: 'https://b.example' },
    ]);
  });

  it('ignores blank lines and lines commented out with #', () => {
    const { entries } = parseBulk('# name,url\n\nhttps://a.example\n   \n');
    expect(entries).toHaveLength(1);
    expect(entries[0].value).toBe('https://a.example');
  });

  it('takes the text before the first comma as the file name', () => {
    const { entries } = parseBulk('席1,https://a.example');
    expect(entries[0]).toEqual({ name: '席1', value: 'https://a.example' });
  });

  it('splits on the first comma only, so a URL keeps its own commas', () => {
    const { entries } = parseBulk('map,https://example.com/?ll=35.6,139.7');
    expect(entries[0].value).toBe('https://example.com/?ll=35.6,139.7');
  });

  it('numbers repeated names instead of overwriting them in the ZIP', () => {
    const { entries } = parseBulk('a,1\na,2\na,3');
    expect(entries.map((entry) => entry.name)).toEqual(['a', 'a-2', 'a-3']);
  });

  it('drops a line whose value is empty', () => {
    expect(parseBulk('name,\n,value').entries).toEqual([
      { name: 'qr-1', value: 'value' },
    ]);
  });

  it('stops at the limit and reports what it skipped', () => {
    const lines = Array.from({ length: BULK_LIMIT + 5 }, (_, i) => `v${i}`);
    const { entries, skipped } = parseBulk(lines.join('\n'));
    expect(entries).toHaveLength(BULK_LIMIT);
    expect(skipped).toBe(5);
  });

  it('accepts the line endings a pasted spreadsheet brings', () => {
    expect(parseBulk('a\r\nb\rc').entries).toHaveLength(3);
  });
});

describe('safeFileName', () => {
  it('removes the characters a file system refuses', () => {
    expect(safeFileName('a/b:c*d?e"f<g>h|i', 'fallback')).toBe('abcdefghi');
  });

  it('falls back when nothing usable is left', () => {
    expect(safeFileName('///', 'qr-1')).toBe('qr-1');
    expect(safeFileName('  ', 'qr-1')).toBe('qr-1');
    expect(safeFileName('..', 'qr-1')).toBe('qr-1');
  });

  it('keeps Japanese names, which are perfectly legal in a ZIP', () => {
    expect(safeFileName('会議室A', 'qr-1')).toBe('会議室A');
  });

  it('truncates a very long name rather than producing an unusable file', () => {
    expect(safeFileName('x'.repeat(200), 'qr-1')).toHaveLength(60);
  });
});
