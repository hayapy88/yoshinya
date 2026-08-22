import type { CompressionSettings } from './types'

export type Dimensions = { width: number; height: number }

/**
 * The pixel size to encode at.
 *
 * Only one of width/height is required: the other is derived from the aspect
 * ratio, which is what someone means by "make these 1200px wide". With both
 * given and the ratio unlocked, the image is stretched to exactly that box —
 * `isDistorted` reports it so the UI can warn rather than silently deforming.
 */
export function targetDimensions(
  source: Dimensions,
  settings: Pick<
    CompressionSettings,
    'resizeEnabled' | 'width' | 'height' | 'keepAspectRatio' | 'preventUpscale'
  >,
): Dimensions & { isDistorted: boolean } {
  const unchanged = { ...source, isDistorted: false }
  if (!settings.resizeEnabled) {
    return unchanged
  }
  const { width, height, keepAspectRatio, preventUpscale } = settings
  if (width === null && height === null) {
    return unchanged
  }

  let target: Dimensions
  let isDistorted = false

  if (keepAspectRatio || width === null || height === null) {
    const ratio = source.width / source.height
    if (width !== null && height !== null) {
      // Both given with the ratio locked: fit inside the box rather than
      // overflowing it.
      const scale = Math.min(width / source.width, height / source.height)
      target = { width: source.width * scale, height: source.height * scale }
    } else if (width !== null) {
      target = { width, height: width / ratio }
    } else if (height !== null) {
      target = { width: height * ratio, height }
    } else {
      return unchanged
    }
  } else {
    target = { width, height }
    isDistorted = Math.abs(width / height - source.width / source.height) > 0.01
  }

  if (preventUpscale) {
    const scale = Math.min(
      1,
      source.width / target.width,
      source.height / target.height,
    )
    if (scale < 1) {
      target = { width: target.width * scale, height: target.height * scale }
    }
  }

  return {
    // At least one pixel each way: a zero-sized canvas throws.
    width: Math.max(1, Math.round(target.width)),
    height: Math.max(1, Math.round(target.height)),
    isDistorted,
  }
}

/** The partner dimension while the user types, with the ratio locked. */
export function pairedDimension(
  source: Dimensions,
  edited: 'width' | 'height',
  value: number | null,
): number | null {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return null
  }
  const ratio = source.width / source.height
  return edited === 'width'
    ? Math.max(1, Math.round(value / ratio))
    : Math.max(1, Math.round(value * ratio))
}
