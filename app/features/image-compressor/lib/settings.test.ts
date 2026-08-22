import { describe, expect, it } from 'vitest';
import {
  clampQuality,
  effectiveSettings,
  hasOverride,
  mimeForFormat,
  needsBackground,
  resolveFormat,
  supportsQuality,
  withOverride,
} from './settings';
import { DEFAULT_SETTINGS, type CompressionSettings } from './types';

const common: CompressionSettings = { ...DEFAULT_SETTINGS };

describe('effectiveSettings', () => {
  it('returns the common settings when nothing is overridden', () => {
    expect(effectiveSettings(common, { settingsOverride: null })).toEqual(
      common,
    );
  });

  it('lets an override win for the fields it names', () => {
    const result = effectiveSettings(common, {
      settingsOverride: { quality: 60 },
    });
    expect(result.quality).toBe(60);
    expect(result.outputFormat).toBe(common.outputFormat);
  });

  it('keeps untouched fields following the common settings', () => {
    // The point of a partial override: changing the shared quality still moves
    // an image that only overrode its format.
    const item = { settingsOverride: { outputFormat: 'webp' as const } };
    const moved = effectiveSettings({ ...common, quality: 55 }, item);
    expect(moved.quality).toBe(55);
    expect(moved.outputFormat).toBe('webp');
  });
});

describe('withOverride', () => {
  it('records a value that differs from the common setting', () => {
    expect(withOverride(common, null, { quality: 50 })).toEqual({
      quality: 50,
    });
  });

  it('drops a value that matches the common setting again', () => {
    // Otherwise an image would stay flagged as customised while identical to
    // the common settings.
    expect(
      withOverride(common, { quality: 50 }, { quality: common.quality }),
    ).toBeNull();
  });

  it('keeps other overrides when one is cleared', () => {
    const result = withOverride(
      common,
      { quality: 50, outputFormat: 'png' },
      { quality: common.quality },
    );
    expect(result).toEqual({ outputFormat: 'png' });
  });

  it('merges rather than replaces', () => {
    expect(
      withOverride(common, { quality: 50 }, { outputFormat: 'webp' }),
    ).toEqual({
      quality: 50,
      outputFormat: 'webp',
    });
  });
});

describe('hasOverride', () => {
  it('is false for null and for an emptied override', () => {
    expect(hasOverride({ settingsOverride: null })).toBe(false);
    expect(hasOverride({ settingsOverride: {} })).toBe(false);
  });

  it('is true once a field differs', () => {
    expect(hasOverride({ settingsOverride: { quality: 40 } })).toBe(true);
  });
});

describe('resolveFormat', () => {
  it('keeps the source format when asked to', () => {
    expect(resolveFormat('original', 'image/png')).toBe('png');
    expect(resolveFormat('original', 'image/jpeg')).toBe('jpeg');
    expect(resolveFormat('original', 'image/webp')).toBe('webp');
  });

  it('falls back to png for a source it cannot re-encode', () => {
    // Lossless, so nothing is thrown away by the fallback.
    expect(resolveFormat('original', 'image/gif')).toBe('png');
  });

  it('honours an explicit format', () => {
    expect(resolveFormat('webp', 'image/png')).toBe('webp');
  });
});

describe('format capabilities', () => {
  it('offers quality only where the encoder uses it', () => {
    expect(supportsQuality('jpeg')).toBe(true);
    expect(supportsQuality('webp')).toBe(true);
    // Canvas ignores the quality argument for PNG; showing a slider would be
    // a lie.
    expect(supportsQuality('png')).toBe(false);
  });

  it('maps formats to the mime type the canvas expects', () => {
    expect(mimeForFormat('jpeg')).toBe('image/jpeg');
    expect(mimeForFormat('png')).toBe('image/png');
    expect(mimeForFormat('webp')).toBe('image/webp');
  });

  it('asks for a background only when transparency could be lost', () => {
    expect(needsBackground('jpeg', 'image/png')).toBe(true);
    expect(needsBackground('jpeg', 'image/webp')).toBe(true);
    expect(needsBackground('jpeg', 'image/jpeg')).toBe(false);
    expect(needsBackground('png', 'image/png')).toBe(false);
  });
});

describe('clampQuality', () => {
  it('holds the value inside 1-100', () => {
    expect(clampQuality(0)).toBe(1);
    expect(clampQuality(150)).toBe(100);
    expect(clampQuality(85)).toBe(85);
  });

  it('rounds and survives junk input', () => {
    expect(clampQuality(80.6)).toBe(81);
    expect(clampQuality(Number.NaN)).toBe(DEFAULT_SETTINGS.quality);
  });
});
