import { describe, expect, it } from 'vitest';
import { contrastRatio, normalizeHex, relativeLuminance } from './color';

describe('normalizeHex', () => {
  it('accepts a six-digit value with or without the hash', () => {
    expect(normalizeHex('#FB713C')).toBe('#fb713c');
    expect(normalizeHex('fb713c')).toBe('#fb713c');
  });

  it('expands the three-digit form', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
    expect(normalizeHex('000')).toBe('#000000');
  });

  it('ignores surrounding whitespace, which pasting brings along', () => {
    expect(normalizeHex('  #162E64 ')).toBe('#162e64');
  });

  it('rejects anything that is not a colour', () => {
    for (const input of ['', '#', '#12', '#12345', '#1234567', 'red', '#12345g']) {
      expect(normalizeHex(input)).toBeNull();
    }
  });

  it('rejects a value that would break out of an attribute', () => {
    // The result is written into stroke="…" in generated markup.
    expect(normalizeHex('#000" onload="alert(1)')).toBeNull();
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour against itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#fb713c', '#fb713c')).toBeCloseTo(1, 5);
  });

  it('does not depend on the order of the two colours', () => {
    expect(contrastRatio('#162e64', '#ffffff')).toBeCloseTo(
      contrastRatio('#ffffff', '#162e64'),
      10,
    );
  });

  it('separates the brand colours that work from the ones that do not', () => {
    // Navy on white is safe; coral on white is not, which is why the QR tool
    // warns rather than letting the palette decide.
    expect(contrastRatio('#162e64', '#ffffff')).toBeGreaterThan(12);
    expect(contrastRatio('#fb713c', '#ffffff')).toBeLessThan(3);
  });
});

describe('relativeLuminance', () => {
  it('runs from 0 for black to 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10);
  });

  it('treats an unparseable value as black rather than throwing', () => {
    expect(relativeLuminance('nonsense')).toBe(0);
  });
});
