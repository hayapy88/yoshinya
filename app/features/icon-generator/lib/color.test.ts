import { describe, expect, it } from 'vitest';
import { normalizeHex } from './color';

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
