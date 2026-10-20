import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  classifyFiles,
  isSupportedImage,
  outputFileName,
  resolveDuplicateNames,
} from './files';

const file = (name: string, type: string, size = 100) => ({ name, type, size });

describe('isSupportedImage', () => {
  it('accepts JPEG, PNG and WebP', () => {
    expect(isSupportedImage(file('a.jpg', 'image/jpeg'))).toBe(true);
    expect(isSupportedImage(file('a.png', 'image/png'))).toBe(true);
    expect(isSupportedImage(file('a.webp', 'image/webp'))).toBe(true);
  });

  it('falls back to the extension only when the type is empty', () => {
    expect(isSupportedImage(file('a.PNG', ''))).toBe(true);
    expect(isSupportedImage(file('a.png', 'application/pdf'))).toBe(false);
    expect(isSupportedImage(file('a.gif', 'image/gif'))).toBe(false);
  });
});

describe('classifyFiles', () => {
  it('keeps the good files and lists the refusals with a reason', () => {
    const { accepted, rejected } = classifyFiles(
      [
        file('ok.png', 'image/png'),
        file('doc.pdf', 'application/pdf'),
        file('empty.png', 'image/png', 0),
        file('huge.png', 'image/png', LIMITS.maxFileBytes + 1),
      ],
      { count: 0, bytes: 0 },
    );
    expect(accepted.map((f) => f.name)).toEqual(['ok.png']);
    expect(rejected).toEqual([
      { name: 'doc.pdf', code: 'unsupported_type' },
      { name: 'empty.png', code: 'empty_file' },
      { name: 'huge.png', code: 'file_too_large' },
    ]);
  });

  it('counts the files already added against the limits', () => {
    const { rejected } = classifyFiles([file('one.png', 'image/png')], {
      count: LIMITS.maxFiles,
      bytes: 0,
    });
    expect(rejected[0]!.code).toBe('too_many_files');
  });
});

describe('outputFileName', () => {
  it('turns any input into a PNG name and leaves PNGs alone', () => {
    expect(outputFileName('logo.jpg')).toBe('logo.png');
    expect(outputFileName('ロゴ.webp')).toBe('ロゴ.png');
    expect(outputFileName('Logo.PNG')).toBe('Logo.PNG');
    expect(outputFileName('noext')).toBe('noext.png');
  });
});

describe('resolveDuplicateNames', () => {
  it('numbers collisions, ignoring case', () => {
    expect(resolveDuplicateNames(['logo.png', 'LOGO.png', 'logo.png'])).toEqual(
      ['logo.png', 'LOGO-2.png', 'logo-3.png'],
    );
  });
});
