import { describe, expect, it } from 'vitest';

import {
  applyRename,
  buildFileName,
  formatAlphaIndex,
  formatDate,
  formatNumericIndex,
  formatTime,
  splitExtension,
} from './rename';
import type { RenameInput, RenameToken } from './types';

// 2026-07-05 09:05:03 — single-digit month, day, hours, minutes, and seconds.
const sampleDate = new Date(2026, 6, 5, 9, 5, 3);

describe('formatDate', () => {
  it('formats yyyy-mm-dd with zero padding', () => {
    expect(formatDate(sampleDate, 'yyyy-mm-dd')).toBe('2026-07-05');
  });

  it('formats yyyymmdd with zero padding', () => {
    expect(formatDate(sampleDate, 'yyyymmdd')).toBe('20260705');
  });

  it('formats yyyy-mm with zero padding', () => {
    expect(formatDate(sampleDate, 'yyyy-mm')).toBe('2026-07');
  });

  it('formats yyyymm with zero padding', () => {
    expect(formatDate(sampleDate, 'yyyymm')).toBe('202607');
  });
});

describe('formatTime', () => {
  it('formats hh-mm-ss with zero padding', () => {
    expect(formatTime(sampleDate, 'hh-mm-ss')).toBe('09-05-03');
  });

  it('formats hh-mm with zero padding', () => {
    expect(formatTime(sampleDate, 'hh-mm')).toBe('09-05');
  });
});

describe('formatNumericIndex', () => {
  it('pads to 1 digit', () => {
    expect(formatNumericIndex(1, 1)).toBe('1');
    expect(formatNumericIndex(10, 1)).toBe('10');
  });

  it('pads to 2 digits', () => {
    expect(formatNumericIndex(1, 2)).toBe('01');
    expect(formatNumericIndex(42, 2)).toBe('42');
  });

  it('pads to 3 digits', () => {
    expect(formatNumericIndex(1, 3)).toBe('001');
    expect(formatNumericIndex(42, 3)).toBe('042');
  });

  it('returns overflowing numbers as-is', () => {
    expect(formatNumericIndex(100, 2)).toBe('100');
    expect(formatNumericIndex(1000, 3)).toBe('1000');
  });
});

describe('formatAlphaIndex', () => {
  it('maps within a single letter', () => {
    expect(formatAlphaIndex(1, 'lower')).toBe('a');
    expect(formatAlphaIndex(26, 'lower')).toBe('z');
  });

  it('rolls over like Excel column names', () => {
    expect(formatAlphaIndex(27, 'lower')).toBe('aa');
    expect(formatAlphaIndex(28, 'lower')).toBe('ab');
    expect(formatAlphaIndex(52, 'lower')).toBe('az');
    expect(formatAlphaIndex(53, 'lower')).toBe('ba');
  });

  it('supports upper case', () => {
    expect(formatAlphaIndex(1, 'upper')).toBe('A');
    expect(formatAlphaIndex(27, 'upper')).toBe('AA');
  });
});

describe('splitExtension', () => {
  it('splits a normal file name, preserving case', () => {
    expect(splitExtension('photo.JPG')).toEqual({
      base: 'photo',
      ext: '.JPG',
    });
  });

  it('returns an empty ext when there is no extension', () => {
    expect(splitExtension('README')).toEqual({ base: 'README', ext: '' });
  });

  it('treats dotfiles as base only', () => {
    expect(splitExtension('.gitignore')).toEqual({
      base: '.gitignore',
      ext: '',
    });
  });

  it('splits only at the last dot for multiple extensions', () => {
    expect(splitExtension('archive.tar.gz')).toEqual({
      base: 'archive.tar',
      ext: '.gz',
    });
  });
});

describe('buildFileName', () => {
  const now = new Date(2026, 0, 2, 15, 30, 45);
  const fileDate = new Date(2025, 11, 24, 8, 9, 10);
  const context = { index: 0, fileDate, now };

  it('concatenates text and separator tokens', () => {
    const tokens: RenameToken[] = [
      { id: '1', kind: 'text', value: 'trip' },
      { id: '2', kind: 'separator', char: '_' },
      { id: '3', kind: 'text', value: 'osaka' },
    ];
    expect(buildFileName(tokens, context)).toBe('trip_osaka');
  });

  it('uses fixedDate/fixedTime when source is fixed', () => {
    const tokens: RenameToken[] = [
      {
        id: '1',
        kind: 'date',
        format: 'yyyy-mm-dd',
        source: 'fixed',
        fixedDate: '2026-07-05',
      },
      { id: '2', kind: 'separator', char: '_' },
      {
        id: '3',
        kind: 'time',
        format: 'hh-mm-ss',
        source: 'fixed',
        fixedTime: '09:05:03',
      },
    ];
    expect(buildFileName(tokens, context)).toBe('2026-07-05_09-05-03');
  });

  it('accepts hh:mm fixedTime', () => {
    const tokens: RenameToken[] = [
      {
        id: '1',
        kind: 'time',
        format: 'hh-mm',
        source: 'fixed',
        fixedTime: '09:05',
      },
    ];
    expect(buildFileName(tokens, context)).toBe('09-05');
  });

  it('uses the file date when source is fileModified', () => {
    const tokens: RenameToken[] = [
      {
        id: '1',
        kind: 'date',
        format: 'yyyy-mm-dd',
        source: 'fileModified',
      },
      { id: '2', kind: 'separator', char: '_' },
      { id: '3', kind: 'time', format: 'hh-mm-ss', source: 'fileModified' },
    ];
    expect(buildFileName(tokens, context)).toBe('2025-12-24_08-09-10');
  });

  it('falls back to now when source is fixed but no value is set', () => {
    const tokens: RenameToken[] = [
      { id: '1', kind: 'date', format: 'yyyy-mm-dd', source: 'fixed' },
      { id: '2', kind: 'separator', char: '_' },
      { id: '3', kind: 'time', format: 'hh-mm', source: 'fixed' },
    ];
    expect(buildFileName(tokens, context)).toBe('2026-01-02_15-30');
  });

  it('renders index tokens from start plus position', () => {
    const tokens: RenameToken[] = [
      {
        id: '1',
        kind: 'index',
        style: { type: 'numeric', padding: 2 },
        start: 1,
      },
    ];
    expect(buildFileName(tokens, { ...context, index: 0 })).toBe('01');
    expect(buildFileName(tokens, { ...context, index: 9 })).toBe('10');
  });
});

describe('applyRename', () => {
  const now = new Date(2026, 0, 2, 15, 30, 45);

  it('renames files in order with an index token', () => {
    const inputs: RenameInput[] = [
      { originalName: 'IMG_001.jpg', lastModified: sampleDate.getTime() },
      { originalName: 'IMG_002.png', lastModified: sampleDate.getTime() },
    ];
    const tokens: RenameToken[] = [
      { id: '1', kind: 'text', value: 'photo' },
      { id: '2', kind: 'separator', char: '_' },
      {
        id: '3',
        kind: 'index',
        style: { type: 'numeric', padding: 2 },
        start: 1,
      },
    ];
    expect(applyRename(inputs, tokens, { now })).toEqual([
      { originalName: 'IMG_001.jpg', newName: 'photo_01.jpg', isDuplicate: false },
      { originalName: 'IMG_002.png', newName: 'photo_02.png', isDuplicate: false },
    ]);
  });

  it('flags duplicates when no index token distinguishes files', () => {
    const inputs: RenameInput[] = [
      { originalName: 'a.jpg', lastModified: sampleDate.getTime() },
      { originalName: 'b.jpg', lastModified: sampleDate.getTime() },
      { originalName: 'c.png', lastModified: sampleDate.getTime() },
    ];
    const tokens: RenameToken[] = [{ id: '1', kind: 'text', value: 'photo' }];
    expect(applyRename(inputs, tokens, { now })).toEqual([
      { originalName: 'a.jpg', newName: 'photo.jpg', isDuplicate: true },
      { originalName: 'b.jpg', newName: 'photo.jpg', isDuplicate: true },
      { originalName: 'c.png', newName: 'photo.png', isDuplicate: false },
    ]);
  });

  it('uses each file\'s own modified date with the fileModified source', () => {
    const inputs: RenameInput[] = [
      {
        originalName: 'a.jpg',
        lastModified: new Date(2025, 11, 24, 8, 0, 0).getTime(),
      },
      {
        originalName: 'b.jpg',
        lastModified: new Date(2026, 6, 5, 9, 0, 0).getTime(),
      },
    ];
    const tokens: RenameToken[] = [
      { id: '1', kind: 'date', format: 'yyyy-mm-dd', source: 'fileModified' },
    ];
    expect(applyRename(inputs, tokens, { now })).toEqual([
      { originalName: 'a.jpg', newName: '2025-12-24.jpg', isDuplicate: false },
      { originalName: 'b.jpg', newName: '2026-07-05.jpg', isDuplicate: false },
    ]);
  });
});
