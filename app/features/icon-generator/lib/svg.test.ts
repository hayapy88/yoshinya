import { describe, expect, it } from 'vitest';
import { buildSvg, formatNumber } from './svg';
import { DEFAULT_STYLE, type IconStyle } from './style';
import type { IconDefinition } from './icon-data';

const icon: IconDefinition = {
  id: 'test',
  category: 'basic',
  markup: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8"/>',
  tags: ['test'],
};

const style = (overrides: Partial<IconStyle> = {}): IconStyle => ({
  ...DEFAULT_STYLE,
  ...overrides,
});

describe('formatNumber', () => {
  it('drops floating-point noise', () => {
    // 32 * 0.22 is 7.040000000000001 in binary floating point, and the result
    // is pasted straight into someone else's source file.
    expect(formatNumber(32 * 0.22)).toBe('7.04');
  });

  it('leaves whole numbers without a decimal point', () => {
    expect(formatNumber(24)).toBe('24');
    expect(formatNumber(2.5)).toBe('2.5');
  });
});

describe('buildSvg', () => {
  it('keeps the icon viewBox and writes the chosen size', () => {
    const svg = buildSvg(icon, style({ size: 128 }));
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('width="128"');
    expect(svg).toContain('height="128"');
  });

  it('applies the colour and stroke width to the drawing group', () => {
    const svg = buildSvg(icon, style({ color: '#fb713c', strokeWidth: 1.25 }));
    expect(svg).toContain('stroke="#fb713c"');
    expect(svg).toContain('stroke-width="1.25"');
  });

  it('carries the icon markup through', () => {
    const svg = buildSvg(icon, style());
    expect(svg).toContain('<circle cx="12" cy="12" r="10"/>');
    expect(svg).toContain('<path d="M12 8v8"/>');
  });

  it('emits no background and no transform when the background is off', () => {
    // Padding is still set in the defaults; without a background it would only
    // add invisible margin, so it must not reach the output.
    const svg = buildSvg(icon, style({ background: 'none', padding: 6 }));
    expect(svg).not.toContain('<rect');
    expect(svg).not.toContain('<circle cx="15"');
    expect(svg).not.toContain('transform=');
    expect(svg).toContain('viewBox="0 0 24 24"');
  });

  it('grows the canvas by the padding on both sides when a background is on', () => {
    const svg = buildSvg(icon, style({ background: 'square', padding: 4 }));
    expect(svg).toContain('viewBox="0 0 32 32"');
    expect(svg).toContain('transform="translate(4,4)"');
    expect(svg).toContain('<rect width="32" height="32" fill="#fdf2d0"/>');
  });

  it('draws a circular background that fills the canvas', () => {
    const svg = buildSvg(
      icon,
      style({ background: 'circle', padding: 4, backgroundColor: '#162e64' }),
    );
    expect(svg).toContain('<circle cx="16" cy="16" r="16" fill="#162e64"/>');
  });

  it('rounds the corners in proportion to the canvas', () => {
    const svg = buildSvg(icon, style({ background: 'rounded', padding: 4 }));
    expect(svg).toContain('rx="7.04"');
  });

  it('indents the output, because it is written to be pasted into code', () => {
    const svg = buildSvg(icon, style());
    expect(svg).toContain('\n    <circle');
    expect(svg).toContain('\n    <path');
    expect(svg.endsWith('</svg>\n')).toBe(true);
  });
});
