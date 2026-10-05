import { describe, expect, it } from 'vitest';
import {
  escapeXml,
  estimateEmWidth,
  TEXT_MAX_WIDTH_RATIO,
  TEXT_RATIO_MAX,
  textLayout,
} from './text';

describe('estimateEmWidth', () => {
  it('counts Japanese as a full em and Latin as part of one', () => {
    expect(estimateEmWidth('よしにゃ')).toBe(4);
    expect(estimateEmWidth('ABCD')).toBeCloseTo(2.4, 10);
  });

  it('adds mixed text up rather than guessing from the length', () => {
    expect(estimateEmWidth('AB猫')).toBeCloseTo(2.2, 10);
  });

  it('treats an emoji as a full em', () => {
    expect(estimateEmWidth('🐱')).toBe(1);
  });
});

describe('textLayout', () => {
  it('returns nothing for an empty or blank string', () => {
    expect(textLayout(29, 4, '', 0.08)).toBeNull();
    expect(textLayout(29, 4, '   ', 0.08)).toBeNull();
  });

  it('honours the requested size when the word fits', () => {
    const layout = textLayout(100, 4, 'AB', 0.08);
    expect(layout?.fontSize).toBeCloseTo(8, 10);
  });

  it('shrinks the font rather than widening the band', () => {
    // Ten full-width characters at 12% would be 120% of the width.
    const layout = textLayout(100, 0, 'よしにゃよしにゃよし', TEXT_RATIO_MAX);
    expect(layout).not.toBeNull();
    expect(layout!.fontSize).toBeLessThan(100 * TEXT_RATIO_MAX);
  });

  it('caps the panel, padding included, not just the glyphs', () => {
    // The whole white band is what a scanner loses, and an eight-letter Latin
    // word at the maximum size is what first pushed it past the limit.
    for (const text of ['Yoshinya', 'よしにゃによしにゃ', 'WWWWWWWWWWWW']) {
      const layout = textLayout(29, 4, text, TEXT_RATIO_MAX);
      expect(layout!.width).toBeLessThanOrEqual(29 * TEXT_MAX_WIDTH_RATIO);
    }
  });

  it('centres the band on the code, quiet zone included', () => {
    const layout = textLayout(25, 4, 'よし', 0.08);
    expect(layout?.centerX).toBe(16.5);
    expect(layout?.centerY).toBe(16.5);
    expect(layout!.x + layout!.width / 2).toBeCloseTo(16.5, 10);
  });

  it('pads the panel by a module on each side', () => {
    const layout = textLayout(100, 0, 'AB', 0.08);
    expect(layout!.height).toBeCloseTo(layout!.fontSize + 2, 10);
  });

  it('clamps a size from outside the allowed range', () => {
    expect(textLayout(100, 0, 'A', 5)!.fontSize).toBeCloseTo(12, 10);
    expect(textLayout(100, 0, 'A', 0)!.fontSize).toBeCloseTo(4, 10);
  });
});

describe('escapeXml', () => {
  it('escapes what would end the element early', () => {
    expect(escapeXml('A & B')).toBe('A &amp; B');
    expect(escapeXml('</text><script>')).toBe('&lt;/text&gt;&lt;script&gt;');
  });
});
