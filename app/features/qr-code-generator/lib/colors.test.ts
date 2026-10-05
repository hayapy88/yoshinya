import { describe, expect, it } from 'vitest';
import { assessColors, DEFAULT_DARK, DEFAULT_LIGHT, safeColor } from './colors';

describe('assessColors', () => {
  it('passes black on white', () => {
    const result = assessColors(DEFAULT_DARK, DEFAULT_LIGHT);
    expect(result.lowContrast).toBe(false);
    expect(result.inverted).toBe(false);
  });

  it('passes the brand navy, which is what a branded code would use', () => {
    expect(assessColors('#162e64', '#ffffff').lowContrast).toBe(false);
  });

  it('flags a pair that looks fine on screen but is too close to print', () => {
    // Brand coral on white: 2.9:1, and the kind of choice someone makes
    // because the palette says so.
    const result = assessColors('#fb713c', '#ffffff');
    expect(result.lowContrast).toBe(true);
    expect(result.ratio).toBeLessThan(3);
  });

  it('flags an inverted code separately from a dim one', () => {
    const result = assessColors('#ffffff', '#000000');
    expect(result.inverted).toBe(true);
    // Contrast is perfect; it is the direction that is the problem.
    expect(result.lowContrast).toBe(false);
  });
});

describe('safeColor', () => {
  it('normalizes what a colour field produces', () => {
    expect(safeColor('#ABCDEF', DEFAULT_DARK)).toBe('#abcdef');
  });

  it('falls back rather than writing nonsense into the SVG', () => {
    expect(safeColor('not a colour', DEFAULT_DARK)).toBe(DEFAULT_DARK);
    expect(safeColor('#000" onload="x', DEFAULT_DARK)).toBe(DEFAULT_DARK);
  });
});
