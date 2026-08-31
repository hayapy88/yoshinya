import { describe, expect, it } from 'vitest';
import {
  plannedFileCount,
  pngFileName,
  svgFileName,
  zipEntryPath,
} from './files';
import { DEFAULT_EXPORT, type ExportSettings } from './style';

const exports = (overrides: Partial<ExportSettings> = {}): ExportSettings => ({
  ...DEFAULT_EXPORT,
  ...overrides,
});

describe('file names', () => {
  it('names an SVG without a size', () => {
    expect(svgFileName('house')).toBe('house.svg');
  });

  it('names a PNG with its size', () => {
    expect(pngFileName('house', 128)).toBe('house-128.png');
  });

  it('files SVGs and each PNG size in their own folder', () => {
    expect(zipEntryPath('house.svg')).toBe('svg/house.svg');
    expect(zipEntryPath('house-128.png', 128)).toBe('png/128/house-128.png');
  });
});

describe('plannedFileCount', () => {
  it('counts one file per icon for SVG alone', () => {
    expect(plannedFileCount(5, exports({ svg: true, png: false }))).toBe(5);
  });

  it('counts one file per icon per PNG size', () => {
    expect(
      plannedFileCount(5, exports({ svg: false, png: true, pngSizes: [32, 128] })),
    ).toBe(10);
  });

  it('adds the formats together', () => {
    expect(
      plannedFileCount(3, exports({ svg: true, png: true, pngSizes: [64, 256] })),
    ).toBe(9);
  });

  it('is zero when no format is chosen, which is what disables the button', () => {
    expect(plannedFileCount(10, exports({ svg: false, png: false }))).toBe(0);
  });

  it('ignores the PNG sizes while PNG is off', () => {
    expect(
      plannedFileCount(4, exports({ svg: true, png: false, pngSizes: [16, 32] })),
    ).toBe(4);
  });
});
