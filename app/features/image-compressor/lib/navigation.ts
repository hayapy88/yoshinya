import { effectiveSettings, resolveFormat, supportsQuality } from './settings'
import type { CompressionSettings, ImageItem, ListFilter } from './types'

/**
 * Where "download & next" goes: the next image still needing attention,
 * wrapping to the start once the end is reached, so a user who jumped around
 * still finishes everything. Failed images are skipped — landing on one would
 * offer a download that cannot happen.
 */
export function nextUndownloadedIndex(
  items: ImageItem[],
  from: number,
): number {
  const usable = (item: ImageItem) =>
    !item.downloaded && item.processingState !== 'error'

  for (let i = from + 1; i < items.length; i += 1) {
    if (usable(items[i]!)) {
      return i
    }
  }
  for (let i = 0; i <= from && i < items.length; i += 1) {
    if (usable(items[i]!)) {
      return i
    }
  }
  return -1
}

/**
 * Which images a bulk apply touches: strictly after the current one, not yet
 * downloaded, not failed.
 *
 * The boundaries matter. Reaching backwards would silently redo images the
 * user already settled, and touching downloaded ones would make the file on
 * disk disagree with the app. For a quality apply the target is narrowed
 * further to formats where quality means anything — PNG output ignores it, so
 * including those images would report a count that did not match what changed.
 */
export function bulkTargetIds(
  items: ImageItem[],
  currentIndex: number,
  common: CompressionSettings,
  kind: 'quality' | 'all-settings',
): string[] {
  return items
    .slice(currentIndex + 1)
    .filter((item) => {
      if (item.downloaded || item.processingState === 'error') {
        return false
      }
      if (kind === 'all-settings') {
        return true
      }
      const settings = effectiveSettings(common, item)
      return supportsQuality(resolveFormat(settings.outputFormat, item.sourceType))
    })
    .map((item) => item.id)
}

export function matchesFilter(item: ImageItem, filter: ListFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'not-downloaded':
      return !item.downloaded && item.processingState !== 'error'
    case 'customized':
      return item.settingsOverride !== null
    case 'downloaded':
      return item.downloaded
    case 'error':
      return item.processingState === 'error'
    default:
      return true
  }
}
