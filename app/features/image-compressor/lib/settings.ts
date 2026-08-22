import {
  DEFAULT_SETTINGS,
  type CompressionSettings,
  type EncodableFormat,
  type ImageItem,
  type OutputFormat,
} from './types'

const MIME_BY_FORMAT: Record<EncodableFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const FORMAT_BY_MIME: Record<string, EncodableFormat> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * The settings actually in force for one image: the common settings with the
 * image's own overrides on top. Fields the user never touched on this image
 * keep following the common settings, which is what makes "apply to the rest"
 * useful rather than destructive.
 */
export function effectiveSettings(
  common: CompressionSettings,
  item: Pick<ImageItem, 'settingsOverride'>,
): CompressionSettings {
  return { ...common, ...(item.settingsOverride ?? {}) }
}

export function hasOverride(
  item: Pick<ImageItem, 'settingsOverride'>,
): boolean {
  const override = item.settingsOverride
  return override !== null && Object.keys(override).length > 0
}

/** Resolves "original" against the source type. */
export function resolveFormat(
  outputFormat: OutputFormat,
  sourceType: string,
): EncodableFormat {
  if (outputFormat !== 'original') {
    return outputFormat
  }
  // A source the browser decoded but cannot re-encode falls back to PNG, which
  // is lossless and universally supported.
  return FORMAT_BY_MIME[sourceType] ?? 'png'
}

export function mimeForFormat(format: EncodableFormat): string {
  return MIME_BY_FORMAT[format]
}

/** Only JPEG and WebP have a meaningful quality setting. */
export function supportsQuality(format: EncodableFormat): boolean {
  return format === 'jpeg' || format === 'webp'
}

/** JPEG has no alpha channel, so transparency has to be flattened onto a colour. */
export function needsBackground(
  format: EncodableFormat,
  sourceType: string,
): boolean {
  return format === 'jpeg' && sourceType !== 'image/jpeg'
}

export function clampQuality(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SETTINGS.quality
  }
  return Math.min(100, Math.max(1, Math.round(value)))
}

/**
 * Folds a change into an image's override. A value that matches the common
 * setting is removed rather than stored, so an image only counts as customised
 * while it genuinely differs — otherwise "reset to common settings" would stay
 * offered on an image identical to the common settings.
 */
export function withOverride(
  common: CompressionSettings,
  override: Partial<CompressionSettings> | null,
  patch: Partial<CompressionSettings>,
): Partial<CompressionSettings> | null {
  const next: Partial<CompressionSettings> = { ...(override ?? {}), ...patch }
  for (const key of Object.keys(next) as (keyof CompressionSettings)[]) {
    if (next[key] === common[key]) {
      delete next[key]
    }
  }
  return Object.keys(next).length === 0 ? null : next
}
