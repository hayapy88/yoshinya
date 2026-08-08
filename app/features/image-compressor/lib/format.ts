const UNITS = ['B', 'KB', 'MB', 'GB'] as const

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} ${UNITS[0]}`
  }
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${UNITS[unit]}`
}

export type SizeComparison = {
  before: number
  after: number
  /** Positive when the file got smaller, negative when it grew. */
  savedBytes: number
  /** Percentage, signed the same way. Not rounded toward zero. */
  percent: number
  grew: boolean
}

/**
 * Re-encoding does not always shrink a file — a already-optimised JPEG pushed
 * to a higher quality, or a photo turned into PNG, comes out bigger. The spec
 * is explicit that this must be reported honestly rather than clamped to 0%.
 */
export function compareSize(before: number, after: number): SizeComparison {
  const savedBytes = before - after
  const percent = before === 0 ? 0 : (savedBytes / before) * 100
  return {
    before,
    after,
    savedBytes,
    percent,
    grew: after > before,
  }
}

export function formatPercent(percent: number): string {
  return `${Math.abs(percent).toFixed(0)}%`
}

/** Totals across the images that produced an output, ignoring the rest. */
export function totalComparison(
  items: { sourceFile: { size: number }; outputBlob: Blob | null }[],
): SizeComparison {
  let before = 0
  let after = 0
  for (const item of items) {
    if (!item.outputBlob) {
      continue
    }
    before += item.sourceFile.size
    after += item.outputBlob.size
  }
  return compareSize(before, after)
}
