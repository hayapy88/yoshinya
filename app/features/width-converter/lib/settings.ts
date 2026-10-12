import {
  CATEGORIES,
  DIRECTIONS,
  type Category,
  type ConvertSettings,
  type Direction,
} from './convert';

export const STORAGE_KEY = 'yoshinya:width-converter:v1';

/** Longer than anyone types by hand; stops a pasted essay being remembered. */
export const EXCLUDE_MAX = 100;

/**
 * The house style for Japanese web copy: half-width letters and digits,
 * full-width katakana. Symbols and spaces are left alone, because which way
 * （） and ！ should go is a style choice, and guessing it would change text
 * nobody asked to change.
 */
export const DEFAULT_SETTINGS: ConvertSettings = {
  alnum: 'half',
  kana: 'full',
  symbol: 'keep',
  space: 'keep',
  exclude: '',
};

/**
 * Read back defensively: localStorage is editable by hand and outlives
 * deploys, so anything unrecognised falls back to the default.
 *
 * Only the rules are stored, never the text being converted.
 */
export function parseSettings(raw: string | null): ConvertSettings {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return DEFAULT_SETTINGS;
  }
  const value = parsed as Record<string, unknown>;
  const settings = { ...DEFAULT_SETTINGS };
  for (const category of CATEGORIES) {
    if (DIRECTIONS.includes(value[category] as Direction)) {
      settings[category as Category] = value[category] as Direction;
    }
  }
  if (typeof value.exclude === 'string') {
    settings.exclude = value.exclude.slice(0, EXCLUDE_MAX);
  }
  return settings;
}

export function readSettings(): {
  settings: ConvertSettings;
  restored: boolean;
} {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return { settings: parseSettings(raw), restored: raw !== null };
  } catch {
    // Private windows and blocked site data throw on access.
    return { settings: DEFAULT_SETTINGS, restored: false };
  }
}

export function writeSettings(settings: ConvertSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage being unavailable must never break the tool.
  }
}

export function isDefault(settings: ConvertSettings): boolean {
  return (
    CATEGORIES.every(
      (category) => settings[category] === DEFAULT_SETTINGS[category],
    ) && settings.exclude === DEFAULT_SETTINGS.exclude
  );
}
