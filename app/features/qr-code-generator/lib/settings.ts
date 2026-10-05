import {
  clamp,
  DEFAULT_ERROR_CORRECTION,
  DEFAULT_MARGIN,
  DEFAULT_SIZE,
  ERROR_CORRECTIONS,
  MARGIN_MAX,
  MARGIN_MIN,
  SIZE_MAX,
  SIZE_MIN,
  type ErrorCorrection,
} from './qr';
import { QR_MODES, type QrMode } from './payload';
import { DEFAULT_DARK, DEFAULT_LIGHT, safeColor } from './colors';
import { LOGO_RATIO_DEFAULT, LOGO_RATIO_MAX, LOGO_RATIO_MIN } from './logo';
import { TEXT_RATIO_DEFAULT, TEXT_RATIO_MAX, TEXT_RATIO_MIN } from './text';

/** What sits over the middle of the code. */
export type CenterType = 'none' | 'logo' | 'text';

const CENTER_TYPES: CenterType[] = ['none', 'logo', 'text'];

export const STORAGE_KEY = 'yoshinya:qr-code-generator:v1';

/**
 * What the tool remembers between visits.
 *
 * Settings only. What was typed — a WiFi password, a phone number, an
 * unannounced URL — is deliberately never stored: this is the one place where
 * remembering would cost more than it saves.
 */
export type StoredSettings = {
  mode: QrMode;
  errorCorrection: ErrorCorrection;
  size: number;
  margin: number;
  dark: string;
  light: string;
  /** How much of the code's width a logo covers. The logo itself is not stored. */
  logoRatio: number;
  centerType: CenterType;
  /** Null means "whatever the code colour is" — the default a brand expects. */
  textColor: string | null;
  textRatio: number;
};

export const DEFAULT_SETTINGS: StoredSettings = {
  mode: 'url',
  errorCorrection: DEFAULT_ERROR_CORRECTION,
  size: DEFAULT_SIZE,
  margin: DEFAULT_MARGIN,
  dark: DEFAULT_DARK,
  light: DEFAULT_LIGHT,
  logoRatio: LOGO_RATIO_DEFAULT,
  centerType: 'none',
  textColor: null,
  textRatio: TEXT_RATIO_DEFAULT,
};

/**
 * Read back defensively: the value comes from localStorage, which is editable
 * by hand and outlives deploys, so anything unrecognised falls back to the
 * default rather than reaching the renderer.
 */
export function parseSettings(raw: string | null): StoredSettings {
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
  return {
    mode: QR_MODES.includes(value.mode as QrMode)
      ? (value.mode as QrMode)
      : DEFAULT_SETTINGS.mode,
    errorCorrection: ERROR_CORRECTIONS.includes(
      value.errorCorrection as ErrorCorrection,
    )
      ? (value.errorCorrection as ErrorCorrection)
      : DEFAULT_SETTINGS.errorCorrection,
    size:
      typeof value.size === 'number' && Number.isFinite(value.size)
        ? Math.round(clamp(value.size, SIZE_MIN, SIZE_MAX))
        : DEFAULT_SETTINGS.size,
    margin:
      typeof value.margin === 'number' && Number.isFinite(value.margin)
        ? Math.round(clamp(value.margin, MARGIN_MIN, MARGIN_MAX))
        : DEFAULT_SETTINGS.margin,
    dark:
      typeof value.dark === 'string'
        ? safeColor(value.dark, DEFAULT_SETTINGS.dark)
        : DEFAULT_SETTINGS.dark,
    light:
      typeof value.light === 'string'
        ? safeColor(value.light, DEFAULT_SETTINGS.light)
        : DEFAULT_SETTINGS.light,
    logoRatio:
      typeof value.logoRatio === 'number' && Number.isFinite(value.logoRatio)
        ? clamp(value.logoRatio, LOGO_RATIO_MIN, LOGO_RATIO_MAX)
        : DEFAULT_SETTINGS.logoRatio,
    centerType: CENTER_TYPES.includes(value.centerType as CenterType)
      ? (value.centerType as CenterType)
      : DEFAULT_SETTINGS.centerType,
    textColor:
      typeof value.textColor === 'string'
        ? safeColor(value.textColor, DEFAULT_DARK)
        : null,
    textRatio:
      typeof value.textRatio === 'number' && Number.isFinite(value.textRatio)
        ? clamp(value.textRatio, TEXT_RATIO_MIN, TEXT_RATIO_MAX)
        : DEFAULT_SETTINGS.textRatio,
  };
}

export function readSettings(): { settings: StoredSettings; restored: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return { settings: parseSettings(raw), restored: raw !== null };
  } catch {
    // Private windows and blocked site data throw on access.
    return { settings: DEFAULT_SETTINGS, restored: false };
  }
}

export function writeSettings(settings: StoredSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage being unavailable must never break the tool.
  }
}
