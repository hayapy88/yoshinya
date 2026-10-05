import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('returns the defaults for a first visit', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('reads back what was stored', () => {
    const stored = {
      mode: 'wifi',
      errorCorrection: 'H',
      size: 1024,
      margin: 2,
      dark: '#162e64',
      light: '#fdf2d0',
      logoRatio: 0.15,
      centerType: 'text',
      textColor: '#ffffff',
      textRatio: 0.1,
    };
    expect(parseSettings(JSON.stringify(stored))).toEqual(stored);
  });

  it('keeps a colour out of the markup unless it is a colour', () => {
    const parsed = parseSettings(
      JSON.stringify({ dark: '#000" onload="x', light: 'chartreuse' }),
    );
    expect(parsed.dark).toBe(DEFAULT_SETTINGS.dark);
    expect(parsed.light).toBe(DEFAULT_SETTINGS.light);
  });

  it('treats a missing text colour as "follow the code colour"', () => {
    expect(parseSettings('{}').textColor).toBeNull();
    expect(
      parseSettings(JSON.stringify({ textColor: 'not a colour' })).textColor,
    ).toBe('#000000');
  });

  it('clamps a logo ratio beyond what the redundancy can rebuild', () => {
    expect(parseSettings(JSON.stringify({ logoRatio: 0.9 })).logoRatio).toBe(
      0.25,
    );
    expect(parseSettings(JSON.stringify({ logoRatio: 0 })).logoRatio).toBe(0.1);
  });

  it('survives anything a hand-edited entry can contain', () => {
    expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('"a string"')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{}')).toEqual(DEFAULT_SETTINGS);
  });

  it('rejects values the UI could never produce', () => {
    const parsed = parseSettings(
      JSON.stringify({ mode: 'telepathy', errorCorrection: 'Z', size: 'big' }),
    );
    expect(parsed.mode).toBe(DEFAULT_SETTINGS.mode);
    expect(parsed.errorCorrection).toBe(DEFAULT_SETTINGS.errorCorrection);
    expect(parsed.size).toBe(DEFAULT_SETTINGS.size);
  });

  it('clamps a size or margin from outside the allowed range', () => {
    const parsed = parseSettings(JSON.stringify({ size: 99999, margin: -5 }));
    expect(parsed.size).toBe(2048);
    expect(parsed.margin).toBe(0);
  });
});
