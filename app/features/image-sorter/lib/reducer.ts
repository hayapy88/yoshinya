import type {
  HistoryEntry,
  ImageItem,
  SortingAction,
  SortingFolder,
  SortingState,
} from './types'

export const initialState: SortingState = {
  images: [],
  folders: [],
  currentIndex: 0,
  history: [],
}

// Counts, derived from state, that the UI needs everywhere.
export function counts(state: SortingState): {
  total: number
  sorted: number
  unsorted: number
} {
  const total = state.images.length
  const sorted = state.images.filter((image) => image.folderId !== null).length
  return { total, sorted, unsorted: total - sorted }
}

// Whether the current folders and images are valid enough to start sorting:
// at least one image, at least one folder, no empty or duplicate folder names.
export function foldersAreValid(state: SortingState): boolean {
  const names = state.folders.map((folder) => folder.name.trim().toLowerCase())
  const hasEmpty = names.some((name) => name.length === 0)
  const hasDuplicate = new Set(names).size !== names.length
  return (
    state.folders.length > 0 &&
    !hasEmpty &&
    !hasDuplicate &&
    counts(state).total > 0
  )
}

// The folder's 1-based number (position in display order). Only 1–9 are bound to
// number keys; the rest are reachable by clicking their button.
export function folderNumber(folders: SortingFolder[], folderId: string): number {
  const ordered = [...folders].sort((a, b) => a.order - b.order)
  return ordered.findIndex((folder) => folder.id === folderId) + 1
}

// Next unsorted image at or after `from`, wrapping once; -1 if none remain.
function nextUnsortedIndex(images: ImageItem[], from: number): number {
  const n = images.length
  for (let step = 0; step < n; step += 1) {
    const index = (from + step) % n
    if (images[index] && images[index].folderId === null) {
      return index
    }
  }
  return -1
}

function withImage(
  images: ImageItem[],
  id: string,
  patch: Partial<ImageItem>,
): ImageItem[] {
  return images.map((image) =>
    image.id === id ? { ...image, ...patch } : image,
  )
}

function clampIndex(index: number, length: number): number {
  if (length === 0) {
    return 0
  }
  return Math.min(Math.max(index, 0), length - 1)
}

export function sortingReducer(
  state: SortingState,
  action: SortingAction,
): SortingState {
  switch (action.type) {
    case 'add_images': {
      if (action.items.length === 0) {
        return state
      }
      return { ...state, images: [...state.images, ...action.items] }
    }

    case 'remove_image': {
      const index = state.images.findIndex((i) => i.id === action.imageId)
      if (index < 0) {
        return state
      }
      const images = state.images.filter((i) => i.id !== action.imageId)
      // Keep pointing at roughly the same spot after removal.
      const currentIndex = clampIndex(
        index <= state.currentIndex ? state.currentIndex - 1 : state.currentIndex,
        images.length,
      )
      return {
        ...state,
        images,
        currentIndex,
        // History referencing the removed image would no longer be valid.
        history: state.history.filter((entry) =>
          entry.changes.every((c) => c.imageId !== action.imageId),
        ),
      }
    }

    case 'mark_error': {
      return {
        ...state,
        images: withImage(state.images, action.imageId, { error: true }),
      }
    }

    case 'add_folder': {
      const order =
        state.folders.reduce((max, folder) => Math.max(max, folder.order), -1) + 1
      const folder: SortingFolder = { id: action.id, name: action.name, order }
      return { ...state, folders: [...state.folders, folder] }
    }

    case 'rename_folder': {
      return {
        ...state,
        folders: state.folders.map((folder) =>
          folder.id === action.folderId ? { ...folder, name: action.name } : folder,
        ),
      }
    }

    case 'remove_folder': {
      const folders = state.folders
        .filter((folder) => folder.id !== action.folderId)
        .map((folder, index) => ({ ...folder, order: index }))
      // Images in the removed folder return to unsorted; they are never deleted.
      const images = state.images.map((image) =>
        image.folderId === action.folderId ? { ...image, folderId: null } : image,
      )
      return { ...state, folders, images }
    }

    case 'sort_current': {
      const current = state.images[state.currentIndex]
      if (!current) {
        return state
      }
      const entry: HistoryEntry = {
        changes: [{ imageId: current.id, from: current.folderId }],
        prevIndex: state.currentIndex,
      }
      const images = withImage(state.images, current.id, {
        folderId: action.folderId,
      })
      const next = nextUnsortedIndex(images, state.currentIndex + 1)
      return {
        ...state,
        images,
        currentIndex: next >= 0 ? next : state.currentIndex,
        history: [...state.history, entry],
      }
    }

    case 'set_index': {
      return {
        ...state,
        currentIndex: clampIndex(action.index, state.images.length),
      }
    }

    case 'move_images': {
      const ids = new Set(action.imageIds)
      const changes = state.images
        .filter((image) => ids.has(image.id) && image.folderId !== action.folderId)
        .map((image) => ({ imageId: image.id, from: image.folderId }))
      if (changes.length === 0) {
        return state
      }
      const images = state.images.map((image) =>
        ids.has(image.id) ? { ...image, folderId: action.folderId } : image,
      )
      const entry: HistoryEntry = { changes, prevIndex: state.currentIndex }
      return { ...state, images, history: [...state.history, entry] }
    }

    case 'undo': {
      const entry = state.history[state.history.length - 1]
      if (!entry) {
        return state
      }
      let images = state.images
      for (const change of entry.changes) {
        images = withImage(images, change.imageId, { folderId: change.from })
      }
      return {
        ...state,
        images,
        currentIndex: clampIndex(entry.prevIndex, images.length),
        history: state.history.slice(0, -1),
      }
    }
  }
}
