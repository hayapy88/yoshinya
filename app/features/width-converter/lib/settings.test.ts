import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  EXCLUDE_MAX,
  isDefault,
  parseSettings,
} from './settings';

describe('parseSettings', () => {
  it('falls back to the defaults for missing or broken data', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps recognised values and drops the rest', () => {
    expect(
      parseSettings(
        JSON.stringify({
          alnum: 'full',
          kana: 'sideways',
          symbol: 'half',
          space: 7,
          exclude: '（）',
        }),
      ),
    ).toEqual({
      alnum: 'full',
      kana: 'full',
      symbol: 'half',
      space: 'keep',
      exclude: '（）',
    });
  });

  it('caps the excluded characters', () => {
    const settings = parseSettings(
      JSON.stringify({ exclude: 'あ'.repeat(EXCLUDE_MAX + 50) }),
    );
    expect(settings.exclude).toHaveLength(EXCLUDE_MAX);
  });
});

describe('isDefault', () => {
  it('is true only for the defaults', () => {
    expect(isDefault(DEFAULT_SETTINGS)).toBe(true);
    expect(isDefault({ ...DEFAULT_SETTINGS, space: 'half' })).toBe(false);
    expect(isDefault({ ...DEFAULT_SETTINGS, exclude: '!' })).toBe(false);
  });
});
