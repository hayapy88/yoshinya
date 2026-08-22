import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { createZipBlob } from './zip';

describe('createZipBlob', () => {
  it('stores each file under its new name with identical content', async () => {
    const blob = await createZipBlob([
      { name: 'photo_01.txt', file: new File(['hello'], 'a.txt') },
      { name: 'photo_02.txt', file: new File(['world'], 'b.txt') },
    ]);

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual([
      'photo_01.txt',
      'photo_02.txt',
    ]);
    expect(await zip.file('photo_01.txt')!.async('string')).toBe('hello');
    expect(await zip.file('photo_02.txt')!.async('string')).toBe('world');
  });

  it('creates an empty zip for no entries', async () => {
    const blob = await createZipBlob([]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files)).toEqual([]);
  });
});
