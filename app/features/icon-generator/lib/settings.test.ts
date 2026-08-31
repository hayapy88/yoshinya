import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  parseSettings,
  serializeSettings,
} from './settings';

describe('parseSettings', () => {
  it('returns the defaults when nothing has been saved', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('returns the defaults for a value that is not JSON', () => {
    expect(parseSettings('{oops')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('"a string"')).toEqual(DEFAULT_SETTINGS);
  });

  it('survives a round trip unchanged', () => {
    const settings = {
      style: {
        color: '#fb713c',
        strokeWidth: 1.5,
        size: 256,
        background: 'circle' as const,
        backgroundColor: '#162e64',
        padding: 6,
      },
      exports: { svg: false, png: true, pngSizes: [32, 256] },
    };
    expect(parseSettings(serializeSettings(settings))).toEqual(settings);
  });

  it('clamps numbers that are out of range', () => {
    const { style } = parseSettings(
      JSON.stringify({ style: { size: 99999, strokeWidth: -4, padding: 40 } }),
    );
    expect(style.size).toBe(1024);
    expect(style.strokeWidth).toBe(0.5);
    expect(style.padding).toBe(8);
  });

  // localStorage outlives deploys, so a value written by an older build has to
  // degrade to a default rather than reach the SVG builder.
  it('falls back for an unknown background shape', () => {
    const { style } = parseSettings(
      JSON.stringify({ style: { background: 'hexagon' } }),
    );
    expect(style.background).toBe(DEFAULT_SETTINGS.style.background);
  });

  it('falls back for a colour that is not a colour', () => {
    const { style } = parseSettings(
      JSON.stringify({ style: { color: 'javascript:alert(1)' } }),
    );
    expect(style.color).toBe(DEFAULT_SETTINGS.style.color);
  });

  it('normalizes a saved colour rather than trusting its form', () => {
    const { style } = parseSettings(JSON.stringify({ style: { color: 'ABC' } }));
    expect(style.color).toBe('#aabbcc');
  });

  it('drops PNG sizes the tool does not offer', () => {
    const { exports } = parseSettings(
      JSON.stringify({ exports: { pngSizes: [128, 999, 'big'] } }),
    );
    expect(exports.pngSizes).toEqual([128]);
  });

  // PNG checked with no sizes would produce an export that writes nothing.
  it('restores a default size when every saved size is unusable', () => {
    const { exports } = parseSettings(
      JSON.stringify({ exports: { png: true, pngSizes: [] } }),
    );
    expect(exports.pngSizes).toEqual(DEFAULT_SETTINGS.exports.pngSizes);
  });

  it('rounds a fractional size, since it becomes a pixel count', () => {
    const { style } = parseSettings(JSON.stringify({ style: { size: 64.7 } }));
    expect(style.size).toBe(65);
  });
});
