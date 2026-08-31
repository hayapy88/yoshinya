import { normalizeHex } from './color';
import {
  BACKGROUND_SHAPES,
  DEFAULT_EXPORT,
  DEFAULT_STYLE,
  PADDING_MAX,
  PADDING_MIN,
  PNG_SIZES,
  SIZE_MAX,
  SIZE_MIN,
  STROKE_MAX,
  STROKE_MIN,
  clamp,
  type BackgroundShape,
  type ExportSettings,
  type IconStyle,
} from './style';

export const STORAGE_KEY = 'yoshinya:icon-generator:v1';

export type StoredSettings = { style: IconStyle; exports: ExportSettings };

export const DEFAULT_SETTINGS: StoredSettings = {
  style: DEFAULT_STYLE,
  exports: DEFAULT_EXPORT,
};

function num(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(value, min, max)
    : fallback;
}

function color(value: unknown, fallback: string): string {
  return typeof value === 'string' ? (normalizeHex(value) ?? fallback) : fallback;
}

/**
 * Reads back what was saved last time.
 *
 * Written defensively on purpose: the value comes from localStorage, which is
 * editable, survives across deploys, and will one day hold the shape an older
 * version of this tool wrote. Anything unrecognised falls back to the default
 * rather than reaching the SVG builder, so a stale or hand-edited entry can
 * never produce broken markup.
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

  const source = parsed as { style?: unknown; exports?: unknown };
  const style = (source.style ?? {}) as Partial<Record<keyof IconStyle, unknown>>;
  const exports = (source.exports ?? {}) as Partial<
    Record<keyof ExportSettings, unknown>
  >;

  const sizes = Array.isArray(exports.pngSizes)
    ? exports.pngSizes.filter(
        (size): size is number =>
          typeof size === 'number' && PNG_SIZES.includes(size),
      )
    : [];

  return {
    style: {
      color: color(style.color, DEFAULT_STYLE.color),
      strokeWidth: num(
        style.strokeWidth,
        DEFAULT_STYLE.strokeWidth,
        STROKE_MIN,
        STROKE_MAX,
      ),
      size: Math.round(
        num(style.size, DEFAULT_STYLE.size, SIZE_MIN, SIZE_MAX),
      ),
      background: BACKGROUND_SHAPES.includes(style.background as BackgroundShape)
        ? (style.background as BackgroundShape)
        : DEFAULT_STYLE.background,
      backgroundColor: color(
        style.backgroundColor,
        DEFAULT_STYLE.backgroundColor,
      ),
      padding: num(
        style.padding,
        DEFAULT_STYLE.padding,
        PADDING_MIN,
        PADDING_MAX,
      ),
    },
    exports: {
      svg: typeof exports.svg === 'boolean' ? exports.svg : DEFAULT_EXPORT.svg,
      png: typeof exports.png === 'boolean' ? exports.png : DEFAULT_EXPORT.png,
      // An empty list would leave the PNG checkbox on with nothing to write.
      pngSizes: sizes.length > 0 ? sizes : DEFAULT_EXPORT.pngSizes,
    },
  };
}

export function serializeSettings(settings: StoredSettings): string {
  return JSON.stringify(settings);
}
