import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, isDefault, parseSettings } from './settings';

describe('parseSettings', () => {
  it('falls back to the defaults for missing or broken data', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('reads back valid settings', () => {
    expect(
      parseSettings(
        JSON.stringify({ mode: 'global', tolerance: 30, smoothEdges: false }),
      ),
    ).toEqual({ mode: 'global', tolerance: 30, smoothEdges: false });
  });

  it('keeps the valid fields and drops the rest', () => {
    expect(
      parseSettings(JSON.stringify({ mode: 'magic', tolerance: '9' })),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps and rounds the tolerance', () => {
    expect(parseSettings(JSON.stringify({ tolerance: 400 })).tolerance).toBe(
      50,
    );
    expect(parseSettings(JSON.stringify({ tolerance: -3 })).tolerance).toBe(0);
    expect(parseSettings(JSON.stringify({ tolerance: 7.6 })).tolerance).toBe(8);
  });
});

describe('isDefault', () => {
  it('tells the defaults apart from a change', () => {
    expect(isDefault(DEFAULT_SETTINGS)).toBe(true);
    expect(isDefault({ ...DEFAULT_SETTINGS, tolerance: 13 })).toBe(false);
  });
});
