import { describe, expect, it } from 'vitest'
import {
  bulkTargetIds,
  matchesFilter,
  nextUndownloadedIndex,
} from './navigation'
import {
  DEFAULT_SETTINGS,
  type CompressionSettings,
  type ImageItem,
} from './types'

const common: CompressionSettings = { ...DEFAULT_SETTINGS }

const item = (id: string, over: Partial<ImageItem> = {}): ImageItem => ({
  id,
  sourceFile: new File([], `${id}.jpg`, { type: 'image/jpeg' }),
  sourceUrl: '',
  sourceType: 'image/jpeg',
  sourceWidth: 100,
  sourceHeight: 100,
  outputBlob: null,
  outputUrl: null,
  outputWidth: null,
  outputHeight: null,
  settingsOverride: null,
  processingState: 'ready',
  downloaded: false,
  errorCode: null,
  ...over,
})

describe('nextUndownloadedIndex', () => {
  it('moves to the next image still needing a download', () => {
    expect(nextUndownloadedIndex([item('a'), item('b'), item('c')], 0)).toBe(1)
  })

  it('skips images already downloaded', () => {
    const items = [item('a'), item('b', { downloaded: true }), item('c')]
    expect(nextUndownloadedIndex(items, 0)).toBe(2)
  })

  it('skips failed images, which cannot be downloaded', () => {
    const items = [
      item('a'),
      item('b', { processingState: 'error', errorCode: 'decode_failed' }),
      item('c'),
    ]
    expect(nextUndownloadedIndex(items, 0)).toBe(2)
  })

  it('wraps to the start so a user who jumped around still finishes', () => {
    const items = [
      item('a'),
      item('b', { downloaded: true }),
      item('c', { downloaded: true }),
    ]
    expect(nextUndownloadedIndex(items, 1)).toBe(0)
  })

  it('returns -1 once everything is done', () => {
    const items = [
      item('a', { downloaded: true }),
      item('b', { downloaded: true }),
    ]
    expect(nextUndownloadedIndex(items, 0)).toBe(-1)
  })

  it('returns -1 when only failed images remain', () => {
    const items = [
      item('a', { downloaded: true }),
      item('b', { processingState: 'error', errorCode: 'encode_failed' }),
    ]
    expect(nextUndownloadedIndex(items, 0)).toBe(-1)
  })
})

describe('bulkTargetIds', () => {
  it('takes only images after the current one', () => {
    const items = [item('a'), item('b'), item('c'), item('d')]
    expect(bulkTargetIds(items, 1, common, 'quality')).toEqual(['c', 'd'])
  })

  it('never includes the current image', () => {
    const items = [item('a'), item('b')]
    expect(bulkTargetIds(items, 0, common, 'quality')).not.toContain('a')
  })

  it('leaves downloaded images alone', () => {
    // Changing one would make the file already on disk disagree with the app.
    const items = [item('a'), item('b', { downloaded: true }), item('c')]
    expect(bulkTargetIds(items, 0, common, 'quality')).toEqual(['c'])
  })

  it('leaves failed images alone', () => {
    const items = [
      item('a'),
      item('b', { processingState: 'error', errorCode: 'decode_failed' }),
      item('c'),
    ]
    expect(bulkTargetIds(items, 0, common, 'quality')).toEqual(['c'])
  })

  it('excludes png output from a quality apply, where quality does nothing', () => {
    const items = [
      item('a'),
      item('b', { settingsOverride: { outputFormat: 'png' } }),
      item('c'),
    ]
    expect(bulkTargetIds(items, 0, common, 'quality')).toEqual(['c'])
  })

  it('excludes a png source kept in its original format', () => {
    const items = [item('a'), item('b', { sourceType: 'image/png' }), item('c')]
    expect(bulkTargetIds(items, 0, common, 'quality')).toEqual(['c'])
  })

  it('includes png output for an all-settings apply, where format itself changes', () => {
    const items = [
      item('a'),
      item('b', { settingsOverride: { outputFormat: 'png' } }),
      item('c'),
    ]
    expect(bulkTargetIds(items, 0, common, 'all-settings')).toEqual(['b', 'c'])
  })

  it('is empty at the last image', () => {
    const items = [item('a'), item('b')]
    expect(bulkTargetIds(items, 1, common, 'quality')).toEqual([])
  })
})

describe('matchesFilter', () => {
  it('separates the list states', () => {
    const plain = item('a')
    const done = item('b', { downloaded: true })
    const custom = item('c', { settingsOverride: { quality: 50 } })
    const failed = item('d', {
      processingState: 'error',
      errorCode: 'decode_failed',
    })

    expect(matchesFilter(plain, 'not-downloaded')).toBe(true)
    expect(matchesFilter(done, 'not-downloaded')).toBe(false)
    expect(matchesFilter(failed, 'not-downloaded')).toBe(false)
    expect(matchesFilter(custom, 'customized')).toBe(true)
    expect(matchesFilter(plain, 'customized')).toBe(false)
    expect(matchesFilter(done, 'downloaded')).toBe(true)
    expect(matchesFilter(failed, 'error')).toBe(true)
    for (const i of [plain, done, custom, failed]) {
      expect(matchesFilter(i, 'all')).toBe(true)
    }
  })

  it('counts a downloaded image that was then customised as both', () => {
    const both = item('e', {
      downloaded: true,
      settingsOverride: { quality: 40 },
    })
    expect(matchesFilter(both, 'downloaded')).toBe(true)
    expect(matchesFilter(both, 'customized')).toBe(true)
  })
})
