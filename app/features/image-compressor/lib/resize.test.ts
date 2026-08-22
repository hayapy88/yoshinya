import { describe, expect, it } from 'vitest';
import { pairedDimension, targetDimensions } from './resize';
import { DEFAULT_SETTINGS } from './types';

const source = { width: 4000, height: 3000 };
const base = { ...DEFAULT_SETTINGS, resizeEnabled: true };

describe('targetDimensions', () => {
  it('keeps the original size when resizing is off', () => {
    expect(
      targetDimensions(source, { ...base, resizeEnabled: false, width: 100 }),
    ).toEqual({
      ...source,
      isDistorted: false,
    });
  });

  it('derives the height from a width alone', () => {
    expect(targetDimensions(source, { ...base, width: 2000 })).toEqual({
      width: 2000,
      height: 1500,
      isDistorted: false,
    });
  });

  it('derives the width from a height alone', () => {
    expect(targetDimensions(source, { ...base, height: 600 })).toEqual({
      width: 800,
      height: 600,
      isDistorted: false,
    });
  });

  it('fits inside the box when both are given and the ratio is locked', () => {
    // 1000x1000 on a 4:3 image means "fit within", not "stretch to".
    expect(
      targetDimensions(source, { ...base, width: 1000, height: 1000 }),
    ).toEqual({
      width: 1000,
      height: 750,
      isDistorted: false,
    });
  });

  it('stretches to both when the ratio is unlocked, and says so', () => {
    const result = targetDimensions(source, {
      ...base,
      width: 1000,
      height: 1000,
      keepAspectRatio: false,
    });
    expect(result.width).toBe(1000);
    expect(result.height).toBe(1000);
    expect(result.isDistorted).toBe(true);
  });

  it('does not flag a stretch that happens to match the ratio', () => {
    const result = targetDimensions(source, {
      ...base,
      width: 2000,
      height: 1500,
      keepAspectRatio: false,
    });
    expect(result.isDistorted).toBe(false);
  });

  it('refuses to enlarge while upscaling is prevented', () => {
    // Blowing a small image up adds bytes and no detail.
    expect(targetDimensions(source, { ...base, width: 8000 })).toEqual({
      ...source,
      isDistorted: false,
    });
  });

  it('enlarges once upscaling is allowed', () => {
    expect(
      targetDimensions(source, { ...base, width: 8000, preventUpscale: false }),
    ).toEqual({ width: 8000, height: 6000, isDistorted: false });
  });

  it('never returns a zero dimension, which would throw on a canvas', () => {
    const result = targetDimensions(
      { width: 1000, height: 10 },
      { ...base, width: 5 },
    );
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });

  it('keeps the original size when neither dimension is filled in', () => {
    expect(
      targetDimensions(source, { ...base, width: null, height: null }),
    ).toEqual({
      ...source,
      isDistorted: false,
    });
  });
});

describe('pairedDimension', () => {
  it('completes the other side from the ratio', () => {
    expect(pairedDimension(source, 'width', 2000)).toBe(1500);
    expect(pairedDimension(source, 'height', 1500)).toBe(2000);
  });

  it('gives nothing back for a cleared or invalid field', () => {
    expect(pairedDimension(source, 'width', null)).toBeNull();
    expect(pairedDimension(source, 'width', 0)).toBeNull();
    expect(pairedDimension(source, 'width', -5)).toBeNull();
  });
});
