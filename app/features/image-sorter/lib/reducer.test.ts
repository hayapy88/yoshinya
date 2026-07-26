import { describe, expect, it } from 'vitest'
import {
  folderNumber,
  counts,
  initialState,
  sortingReducer,
} from './reducer'
import type { ImageItem, SortingState } from './types'

function img(id: string, folderId: string | null = null): ImageItem {
  return {
    id,
    file: new File(['x'], `${id}.jpg`, { type: 'image/png' }),
    name: `${id}.jpg`,
    mimeType: 'image/png',
    previewUrl: `blob:${id}`,
    folderId,
    error: false,
  }
}

// A state with 3 images and 2 folders, nothing sorted yet.
function baseState(): SortingState {
  return {
    images: [img('1'), img('2'), img('3')],
    folders: [
      { id: 'b1', name: 'Main', order: 0 },
      { id: 'b2', name: 'Detail', order: 1 },
    ],
    currentIndex: 0,
    history: [],
  }
}

describe('folders', () => {
  it('adds a folder with the next order and a consecutive number', () => {
    let state = sortingReducer(initialState, {
      type: 'add_folder',
      id: 'a',
      name: 'One',
    })
    state = sortingReducer(state, { type: 'add_folder', id: 'b', name: 'Two' })
    expect(state.folders.map((folder) => folder.order)).toEqual([0, 1])
    expect(folderNumber(state.folders, 'a')).toBe(1)
    expect(folderNumber(state.folders, 'b')).toBe(2)
  })

  it('renames a folder without touching image assignments', () => {
    let state = baseState()
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' })
    state = sortingReducer(state, {
      type: 'rename_folder',
      folderId: 'b1',
      name: 'Renamed',
    })
    expect(state.folders[0].name).toBe('Renamed')
    expect(state.images[0].folderId).toBe('b1')
  })

  it('returns images to unsorted when their folder is removed, keeping them', () => {
    let state = baseState()
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' })
    state = sortingReducer(state, { type: 'remove_folder', folderId: 'b1' })
    expect(state.folders.map((folder) => folder.id)).toEqual(['b2'])
    expect(state.folders[0].order).toBe(0)
    expect(state.images[0].folderId).toBe(null)
    expect(state.images).toHaveLength(3)
  })
})

describe('sorting', () => {
  it('assigns the current image and advances to the next unsorted one', () => {
    let state = baseState()
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' })
    expect(state.images[0].folderId).toBe('b1')
    expect(state.currentIndex).toBe(1)
  })

  it('re-sorting moves the assignment rather than copying', () => {
    let state = baseState()
    state = sortingReducer(state, { type: 'set_index', index: 0 })
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' })
    state = sortingReducer(state, { type: 'set_index', index: 0 })
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b2' })
    expect(state.images.filter((i) => i.id === '1')).toHaveLength(1)
    expect(state.images[0].folderId).toBe('b2')
  })

  it('reports sorted / unsorted counts', () => {
    let state = baseState()
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' })
    expect(counts(state)).toEqual({ total: 3, sorted: 1, unsorted: 2 })
  })

  it('keeps the index on the last image when nothing is left to sort', () => {
    let state = baseState()
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' }) // -> 1
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' }) // -> 2
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' }) // all sorted
    expect(counts(state).unsorted).toBe(0)
    expect(state.currentIndex).toBe(2)
  })
})

describe('bulk move and undo', () => {
  it('moves several images to a folder in one step', () => {
    let state = baseState()
    state = sortingReducer(state, {
      type: 'move_images',
      imageIds: ['1', '3'],
      folderId: 'b2',
    })
    expect(state.images[0].folderId).toBe('b2')
    expect(state.images[2].folderId).toBe('b2')
    expect(state.images[1].folderId).toBe(null)
  })

  it('moves images back to unsorted', () => {
    let state = baseState()
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' })
    state = sortingReducer(state, {
      type: 'move_images',
      imageIds: ['1'],
      folderId: null,
    })
    expect(state.images[0].folderId).toBe(null)
  })

  it('undoes a single sort', () => {
    let state = baseState()
    state = sortingReducer(state, { type: 'sort_current', folderId: 'b1' })
    state = sortingReducer(state, { type: 'undo' })
    expect(state.images[0].folderId).toBe(null)
    expect(state.currentIndex).toBe(0)
    expect(state.history).toHaveLength(0)
  })

  it('undoes a bulk move as one step', () => {
    let state = baseState()
    state = sortingReducer(state, {
      type: 'move_images',
      imageIds: ['1', '2', '3'],
      folderId: 'b1',
    })
    state = sortingReducer(state, { type: 'undo' })
    expect(state.images.every((i) => i.folderId === null)).toBe(true)
  })

  it('does nothing when there is no history', () => {
    const state = baseState()
    expect(sortingReducer(state, { type: 'undo' })).toBe(state)
  })
})

describe('images', () => {
  it('removes a broken image and adjusts the index', () => {
    let state = baseState()
    state = sortingReducer(state, { type: 'set_index', index: 2 })
    state = sortingReducer(state, { type: 'remove_image', imageId: '1' })
    expect(state.images.map((i) => i.id)).toEqual(['2', '3'])
    expect(state.currentIndex).toBe(1)
  })
})
