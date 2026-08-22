import { describe, expect, it } from 'vitest'
import {
  compressorReducer,
  currentItem,
  isRecoverableError,
  downloadableItems,
  initialState,
  type CompressorState,
} from './reducer'
import { bulkTargetIds } from './navigation'
import { effectiveSettings } from './settings'
import { DEFAULT_SETTINGS, type ImageItem } from './types'

const item = (id: string, over: Partial<ImageItem> = {}): ImageItem => ({
  id,
  sourceFile: new File([], `${id}.jpg`, { type: 'image/jpeg' }),
  sourceUrl: `blob:${id}`,
  sourceType: 'image/jpeg',
  sourceWidth: 100,
  sourceHeight: 100,
  outputBlob: new Blob(['x']),
  outputUrl: `blob:${id}-out`,
  outputWidth: 100,
  outputHeight: 100,
  settingsOverride: null,
  processingState: 'ready',
  downloaded: false,
  errorCode: null,
  ...over,
})

const stateWith = (
  items: ImageItem[],
  over: Partial<CompressorState> = {},
): CompressorState => ({
  ...initialState,
  items,
  ...over,
})

const settingsOf = (state: CompressorState, id: string) => {
  const found = state.items.find((i) => i.id === id)!
  return effectiveSettings(state.common, found)
}

/** Runs a bulk apply the way the component does: resolve targets, then apply. */
const applyBulk = (state: CompressorState, kind: 'quality' | 'all-settings') =>
  compressorReducer(state, {
    type: 'bulk_apply',
    kind,
    targetIds: bulkTargetIds(
      state.items,
      state.currentIndex,
      state.common,
      kind,
    ),
  })

describe('editing one image', () => {
  it('records an override without touching the others', () => {
    const before = stateWith([item('a'), item('b')])
    const after = compressorReducer(before, {
      type: 'set_current_override',
      patch: { quality: 55 },
    })
    expect(settingsOf(after, 'a').quality).toBe(55)
    expect(settingsOf(after, 'b').quality).toBe(DEFAULT_SETTINGS.quality)
  })

  it('queues a re-encode but keeps the previous result on screen', () => {
    // Clearing the output made the After side and the divider disappear for the
    // length of a re-encode, which while zoomed in reads as the image jumping.
    // The old result stays visible until its replacement lands.
    const after = compressorReducer(stateWith([item('a')]), {
      type: 'set_current_override',
      patch: { quality: 55 },
    })
    expect(currentItem(after)?.processingState).toBe('queued')
    expect(currentItem(after)?.outputBlob).not.toBeNull()
  })

  it('marks the retained output as not ready, so it cannot be downloaded', () => {
    // The safety that replaces clearing it: downloads are gated on the state,
    // never on the mere presence of a blob.
    const after = compressorReducer(stateWith([item('a')]), {
      type: 'set_current_override',
      patch: { quality: 55 },
    })
    expect(currentItem(after)?.processingState).not.toBe('ready')
    expect(downloadableItems(after)).toEqual([])
  })

  it('returns to the common settings on reset', () => {
    const edited = compressorReducer(stateWith([item('a')]), {
      type: 'set_current_override',
      patch: { quality: 55 },
    })
    const reset = compressorReducer(edited, { type: 'reset_current_to_common' })
    expect(currentItem(reset)?.settingsOverride).toBeNull()
  })
})

describe('changing the common settings', () => {
  it('moves the images that never overrode that field', () => {
    const before = stateWith([
      item('a'),
      item('b', { settingsOverride: { quality: 30 } }),
    ])
    const after = compressorReducer(before, {
      type: 'set_common',
      patch: { quality: 60 },
    })
    expect(settingsOf(after, 'a').quality).toBe(60)
    // b pinned its own quality, so the shared change must not reach it.
    expect(settingsOf(after, 'b').quality).toBe(30)
  })

  it('drops an override once the common setting catches up to its value', () => {
    // "Adjusted" means "differs from the shared settings". Editing an image
    // already applies that rule; without applying it here too, an image stayed
    // badged as adjusted while identical to the common settings.
    let s = stateWith([item('a'), item('b')], { currentIndex: 0 })
    s = compressorReducer(s, { type: 'set_common', patch: { quality: 70 } })
    s = compressorReducer(s, {
      type: 'set_current_override',
      patch: { quality: 50 },
    })
    expect(s.items[0]!.settingsOverride).not.toBeNull()

    s = compressorReducer(s, { type: 'set_common', patch: { quality: 50 } })
    expect(s.items[0]!.settingsOverride).toBeNull()
    expect(settingsOf(s, 'a').quality).toBe(50)
  })

  it('keeps an override when the common change was to a different field', () => {
    let s = stateWith([item('a')], { currentIndex: 0 })
    s = compressorReducer(s, {
      type: 'set_current_override',
      patch: { quality: 50 },
    })
    s = compressorReducer(s, {
      type: 'set_common',
      patch: { outputFormat: 'webp' },
    })
    // The quality genuinely still differs, so the image is still adjusted.
    expect(s.items[0]!.settingsOverride).toEqual({ quality: 50 })
  })

  it('leaves an image alone that pinned exactly the changed field', () => {
    const before = stateWith([item('b', { settingsOverride: { quality: 30 } })])
    const after = compressorReducer(before, {
      type: 'set_common',
      patch: { quality: 60 },
    })
    expect(after.items[0]!.outputBlob).not.toBeNull()
  })
})

describe('applying a quality to the rest', () => {
  const base = () =>
    stateWith([item('a'), item('b'), item('c'), item('d')], { currentIndex: 0 })

  it('applies the current image quality to the later images', () => {
    const edited = compressorReducer(base(), {
      type: 'set_current_override',
      patch: { quality: 85 },
    })
    const after = applyBulk(edited, 'quality')
    for (const id of ['b', 'c', 'd']) {
      expect(settingsOf(after, id).quality).toBe(85)
    }
  })

  it('changes nothing but the quality', () => {
    const start = stateWith(
      [
        item('a'),
        item('b', {
          settingsOverride: {
            outputFormat: 'webp',
            resizeEnabled: true,
            width: 800,
          },
        }),
      ],
      { currentIndex: 0 },
    )
    const edited = compressorReducer(start, {
      type: 'set_current_override',
      patch: { quality: 85 },
    })
    const after = applyBulk(edited, 'quality')
    const b = settingsOf(after, 'b')
    expect(b.quality).toBe(85)
    expect(b.outputFormat).toBe('webp')
    expect(b.resizeEnabled).toBe(true)
    expect(b.width).toBe(800)
  })

  it('leaves earlier, downloaded and failed images untouched', () => {
    const start = stateWith(
      [
        item('a'),
        item('b'),
        item('c', { downloaded: true }),
        item('d', { processingState: 'error', errorCode: 'decode_failed' }),
        item('e'),
      ],
      { currentIndex: 1 },
    )
    const edited = compressorReducer(start, {
      type: 'set_current_override',
      patch: { quality: 85 },
    })
    const after = applyBulk(edited, 'quality')
    expect(settingsOf(after, 'a').quality).toBe(DEFAULT_SETTINGS.quality)
    expect(settingsOf(after, 'c').quality).toBe(DEFAULT_SETTINGS.quality)
    expect(settingsOf(after, 'd').quality).toBe(DEFAULT_SETTINGS.quality)
    expect(settingsOf(after, 'e').quality).toBe(85)
  })

  it('overwrites an existing per-image quality, as the spec chooses', () => {
    const start = stateWith(
      [item('a'), item('b', { settingsOverride: { quality: 20 } })],
      { currentIndex: 0 },
    )
    const edited = compressorReducer(start, {
      type: 'set_current_override',
      patch: { quality: 85 },
    })
    expect(settingsOf(applyBulk(edited, 'quality'), 'b').quality).toBe(85)
  })

  it('queues the affected images for re-encoding', () => {
    const edited = compressorReducer(base(), {
      type: 'set_current_override',
      patch: { quality: 85 },
    })
    const after = applyBulk(edited, 'quality')
    expect(after.items.find((i) => i.id === 'b')?.processingState).toBe(
      'queued',
    )
  })
})

describe('applying every setting to the rest', () => {
  it('replaces the whole effective settings of the targets', () => {
    const start = stateWith(
      [
        item('a'),
        item('b', { settingsOverride: { quality: 20, outputFormat: 'png' } }),
      ],
      { currentIndex: 0 },
    )
    const edited = compressorReducer(start, {
      type: 'set_current_override',
      patch: { quality: 85, outputFormat: 'webp' },
    })
    const after = applyBulk(edited, 'all-settings')
    const b = settingsOf(after, 'b')
    expect(b.quality).toBe(85)
    expect(b.outputFormat).toBe('webp')
  })
})

describe('releasing a pin so an image follows the shared settings again', () => {
  it('releases only the named field, leaving other pins intact', () => {
    let s = stateWith([item('a'), item('b')], { currentIndex: 0 })
    s = compressorReducer(s, {
      type: 'set_current_override',
      patch: { outputFormat: 'png', quality: 40 },
    })
    s = compressorReducer(s, {
      type: 'set_common',
      patch: { outputFormat: 'webp' },
    })
    // Still pinned to png, which is what the user is being offered a way out of.
    expect(settingsOf(s, 'a').outputFormat).toBe('png')

    s = compressorReducer(s, {
      type: 'release_overrides',
      ids: ['a'],
      keys: ['outputFormat'],
    })
    expect(settingsOf(s, 'a').outputFormat).toBe('webp')
    // The quality pin was never in question, so it survives.
    expect(settingsOf(s, 'a').quality).toBe(40)
    expect(s.items[0]!.settingsOverride).toEqual({ quality: 40 })
  })

  it('clears the override entirely when nothing is left pinned', () => {
    let s = stateWith([item('a')], { currentIndex: 0 })
    s = compressorReducer(s, {
      type: 'set_current_override',
      patch: { outputFormat: 'png' },
    })
    s = compressorReducer(s, {
      type: 'release_overrides',
      ids: ['a'],
      keys: ['outputFormat'],
    })
    expect(s.items[0]!.settingsOverride).toBeNull()
  })
})

describe('applying to every image', () => {
  it('reaches the images the shared settings deliberately skip', () => {
    // The shared settings leave individually adjusted images pinned, which is
    // the point of pinning them. This is the one action that overrides that,
    // which is why it sits behind a confirmation.
    let s = stateWith([item('a'), item('b'), item('c', { downloaded: true })], {
      currentIndex: 0,
    })
    s = compressorReducer(s, {
      type: 'set_current_override',
      patch: { outputFormat: 'jpeg' },
    })
    s = compressorReducer(s, { type: 'select_index', index: 1 })
    s = compressorReducer(s, {
      type: 'set_current_override',
      patch: { outputFormat: 'webp' },
    })

    s = compressorReducer(s, { type: 'apply_to_all' })

    // Everything now follows the image that was selected, with nothing pinned.
    for (const id of ['a', 'b', 'c']) {
      expect(settingsOf(s, id).outputFormat).toBe('webp')
      expect(s.items.find((i) => i.id === id)!.settingsOverride).toBeNull()
    }
  })

  it('queues every image for re-encoding', () => {
    let s = stateWith([item('a'), item('b')], { currentIndex: 0 })
    s = compressorReducer(s, { type: 'apply_to_all' })
    expect(s.items.every((i) => i.processingState === 'queued')).toBe(true)
  })
})

describe('undoing a bulk apply', () => {
  it('restores each image to the quality it had', () => {
    const start = stateWith(
      [item('a'), item('b', { settingsOverride: { quality: 20 } }), item('c')],
      { currentIndex: 0 },
    )
    const edited = compressorReducer(start, {
      type: 'set_current_override',
      patch: { quality: 85 },
    })
    const applied = applyBulk(edited, 'quality')
    const undone = compressorReducer(applied, { type: 'undo_bulk' })

    expect(settingsOf(undone, 'b').quality).toBe(20)
    expect(settingsOf(undone, 'c').quality).toBe(DEFAULT_SETTINGS.quality)
  })

  it('restores whether an image had any override at all', () => {
    // c had none; undo must give it none back, not an override that happens to
    // hold the same number — otherwise it would show as customised forever.
    const start = stateWith([item('a'), item('c')], { currentIndex: 0 })
    const edited = compressorReducer(start, {
      type: 'set_current_override',
      patch: { quality: 85 },
    })
    const undone = compressorReducer(applyBulk(edited, 'quality'), {
      type: 'undo_bulk',
    })
    expect(undone.items.find((i) => i.id === 'c')?.settingsOverride).toBeNull()
  })

  it('leaves the image the user was editing alone', () => {
    const start = stateWith([item('a'), item('b')], { currentIndex: 0 })
    const edited = compressorReducer(start, {
      type: 'set_current_override',
      patch: { quality: 85 },
    })
    const undone = compressorReducer(applyBulk(edited, 'quality'), {
      type: 'undo_bulk',
    })
    expect(settingsOf(undone, 'a').quality).toBe(85)
  })

  it('can only be done once', () => {
    const start = stateWith([item('a'), item('b')], { currentIndex: 0 })
    const edited = compressorReducer(start, {
      type: 'set_current_override',
      patch: { quality: 85 },
    })
    const undone = compressorReducer(applyBulk(edited, 'quality'), {
      type: 'undo_bulk',
    })
    expect(undone.undo).toBeNull()
    expect(compressorReducer(undone, { type: 'undo_bulk' })).toBe(undone)
  })

  it('is dropped when the list changes underneath it', () => {
    // The captured target ids no longer describe what the user is looking at.
    const start = stateWith([item('a'), item('b')], { currentIndex: 0 })
    const applied = applyBulk(
      compressorReducer(start, {
        type: 'set_current_override',
        patch: { quality: 85 },
      }),
      'quality',
    )
    expect(applied.undo).not.toBeNull()
    const added = compressorReducer(applied, {
      type: 'add_files',
      items: [item('z')],
      rejected: [],
    })
    expect(added.undo).toBeNull()
  })
})

describe('removing images', () => {
  it('keeps the selection on the same image when an earlier one goes', () => {
    const state = stateWith([item('a'), item('b'), item('c')], {
      currentIndex: 2,
    })
    const after = compressorReducer(state, { type: 'remove_item', id: 'a' })
    expect(currentItem(after)?.id).toBe('c')
  })

  it('does not leave the selection past the end', () => {
    const state = stateWith([item('a'), item('b')], { currentIndex: 1 })
    const after = compressorReducer(state, { type: 'remove_item', id: 'b' })
    expect(after.currentIndex).toBe(0)
  })

  it('clears everything but keeps the settings the user dialled in', () => {
    const state = stateWith([item('a')], {
      common: { ...DEFAULT_SETTINGS, quality: 42 },
    })
    const after = compressorReducer(state, { type: 'remove_all' })
    expect(after.items).toEqual([])
    expect(after.common.quality).toBe(42)
  })
})

describe('recovering from an encode error', () => {
  // The reported dead end: a phone whose browser cannot encode WebP showed
  // "choose JPEG or PNG instead", but the format control was disabled and an
  // errored image was never re-queued, so the advice could not be followed.
  const errored = (code: ImageItem['errorCode']) =>
    item('a', {
      processingState: 'error',
      errorCode: code,
      outputBlob: null,
      outputUrl: null,
    })

  it('retries the image when the shared format changes', () => {
    const state = stateWith([errored('format_unsupported')])
    const after = compressorReducer(state, {
      type: 'set_common',
      patch: { outputFormat: 'jpeg' },
    })
    expect(after.items[0].processingState).toBe('queued')
  })

  it('retries when only this image changes format', () => {
    const state = stateWith([errored('format_unsupported')], { scope: 'image' })
    const after = compressorReducer(state, {
      type: 'set_current_override',
      patch: { outputFormat: 'png' },
    })
    expect(after.items[0].processingState).toBe('queued')
  })

  it('clears the message so a stale error cannot outlive the retry', () => {
    const state = stateWith([errored('format_unsupported')])
    const after = compressorReducer(state, {
      type: 'set_common',
      patch: { outputFormat: 'jpeg' },
    })
    expect(after.items[0].errorCode).toBeNull()
  })

  it('retries an allocation failure, which a smaller size can fix', () => {
    const state = stateWith([errored('out_of_memory')])
    const after = compressorReducer(state, {
      type: 'set_common',
      patch: { resizeEnabled: true, width: 800, height: 600 },
    })
    expect(after.items[0].processingState).toBe('queued')
  })

  // A file that will not decode is a different matter: no setting changes how
  // it is read, so retrying would only flicker back to the same error.
  it('leaves an undecodable file alone', () => {
    const state = stateWith([errored('decode_failed')])
    const after = compressorReducer(state, {
      type: 'set_common',
      patch: { outputFormat: 'jpeg' },
    })
    expect(after.items[0].processingState).toBe('error')
    expect(after.items[0].errorCode).toBe('decode_failed')
  })

  it('does not retry every image, only the ones an edit reaches', () => {
    const state = stateWith([
      errored('format_unsupported'),
      item('b', { settingsOverride: { outputFormat: 'png' } }),
    ])
    const after = compressorReducer(state, {
      type: 'set_common',
      patch: { outputFormat: 'jpeg' },
    })
    expect(after.items[0].processingState).toBe('queued')
    expect(after.items[1].processingState).toBe('ready')
  })
})

// The settings panel reads this directly to decide whether to stay usable, so
// the mapping is pinned rather than left implicit in the reducer cases above.
describe('isRecoverableError', () => {
  it('offers a retry only where a setting could change the outcome', () => {
    expect(isRecoverableError('format_unsupported')).toBe(true)
    expect(isRecoverableError('encode_failed')).toBe(true)
    expect(isRecoverableError('out_of_memory')).toBe(true)
    expect(isRecoverableError('decode_failed')).toBe(false)
    expect(isRecoverableError(null)).toBe(false)
  })
})
