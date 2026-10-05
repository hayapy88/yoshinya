import { describe, expect, it } from 'vitest';
import {
  LOGO_MAX_BYTES,
  LOGO_RATIO_MAX,
  LOGO_RATIO_MIN,
  logoBox,
  rejectLogo,
} from './logo';

describe('logoBox', () => {
  it('centres the logo over the modules, ignoring the quiet zone', () => {
    const box = logoBox(25, 4, 0.2);
    expect(box.size).toBe(5);
    // 4 (margin) + (25 - 5) / 2 = 14
    expect(box.x).toBe(14);
    expect(box.y).toBe(14);
  });

  it('pads the backing panel by one module on every side', () => {
    const box = logoBox(25, 4, 0.2);
    expect(box.backingX).toBe(13);
    expect(box.backingSize).toBe(7);
  });

  it('refuses to cover more of the code than the redundancy can rebuild', () => {
    expect(logoBox(100, 0, 0.9).size).toBe(100 * LOGO_RATIO_MAX);
    expect(logoBox(100, 0, 0).size).toBe(100 * LOGO_RATIO_MIN);
  });

  it('keeps the logo square whatever the code size', () => {
    for (const count of [21, 29, 57, 177]) {
      const box = logoBox(count, 4, 0.2);
      expect(box.x).toBe(box.y);
      expect(box.size).toBeCloseTo(count * 0.2, 10);
    }
  });
});

describe('rejectLogo', () => {
  const file = (type: string, size: number) =>
    ({ type, size }) as File;

  it('accepts the raster formats every browser can draw', () => {
    expect(rejectLogo(file('image/png', 1000))).toBeNull();
    expect(rejectLogo(file('image/jpeg', 1000))).toBeNull();
    expect(rejectLogo(file('image/webp', 1000))).toBeNull();
  });

  it('rejects SVG, which can carry a script into the generated markup', () => {
    expect(rejectLogo(file('image/svg+xml', 1000))).toBe('type');
  });

  it('rejects anything that is not an image', () => {
    expect(rejectLogo(file('application/pdf', 1000))).toBe('type');
  });

  it('rejects a file too large to embed in the saved SVG', () => {
    expect(rejectLogo(file('image/png', LOGO_MAX_BYTES + 1))).toBe('size');
  });
});
