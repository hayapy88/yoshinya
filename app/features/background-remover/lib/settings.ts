import { MODES, type Mode, type RemoveSettings } from './remove';

export const STORAGE_KEY = 'yoshinya:background-remover:v1';

export const TOLERANCE_MIN = 0;
export const TOLERANCE_MAX = 50;

/**
 * Edges only, so a white logo on a white background keeps its white; enough
 * tolerance to swallow JPEG noise without biting into a pale subject; and
 * smooth edges, because a fringe is the first thing anyone notices.
 */
export const DEFAULT_SETTINGS: RemoveSettings = {
  mode: 'connected',
  tolerance: 12,
  smoothEdges: true,
};

/**
 * Read back defensively: localStorage is editable by hand and outlives
 * deploys, so anything unrecognised falls back to the default.
 *
 * Only the settings are stored — never an image, a file name or a click.
 */
export function parseSettings(raw: string | null): RemoveSettings {
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
  if (MODES.includes(value.mode as Mode)) {
    settings.mode = value.mode as Mode;
  }
  if (typeof value.tolerance === 'number' && Number.isFinite(value.tolerance)) {
    settings.tolerance = Math.round(
      Math.min(TOLERANCE_MAX, Math.max(TOLERANCE_MIN, value.tolerance)),
    );
  }
  if (typeof value.smoothEdges === 'boolean') {
    settings.smoothEdges = value.smoothEdges;
  }
  return settings;
}

export function readSettings(): {
  settings: RemoveSettings;
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

export function writeSettings(settings: RemoveSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage being unavailable must never break the tool.
  }
}

export function isDefault(settings: RemoveSettings): boolean {
  return (
    settings.mode === DEFAULT_SETTINGS.mode &&
    settings.tolerance === DEFAULT_SETTINGS.tolerance &&
    settings.smoothEdges === DEFAULT_SETTINGS.smoothEdges
  );
}
