import {
  applyBatch,
  applyFileNameFromTitle,
  applyTitleFromFileName,
  resetItem,
  withField,
  withOutputName,
  type ApplyMode,
  type EditableField,
} from './edits'
import type {
  PdfErrorCode,
  PdfItem,
  PdfMetadataForm,
  RejectedFile,
} from './types'

export type EditorState = {
  items: PdfItem[]
  rejected: RejectedFile[]
  isProcessing: boolean
  processedCount: number
  processTotal: number
  // Set once a run finishes so the UI can report partial success.
  lastResult: { success: number; failed: number } | null
}

export const initialState: EditorState = {
  items: [],
  rejected: [],
  isProcessing: false,
  processedCount: 0,
  processTotal: 0,
  lastResult: null,
}

export type EditorAction =
  | { type: 'add_files'; items: PdfItem[]; rejected: RejectedFile[] }
  | {
      type: 'file_loaded'
      id: string
      pageCount: number
      metadata: PdfMetadataForm
      hasSignature: boolean
    }
  | { type: 'file_failed'; id: string; code: PdfErrorCode }
  | { type: 'edit_field'; id: string; field: EditableField; value: string }
  | { type: 'edit_output_name'; id: string; value: string }
  | { type: 'reset_item'; id: string }
  | { type: 'remove_item'; id: string }
  | { type: 'remove_all' }
  | { type: 'reset_all' }
  | {
      type: 'batch_apply'
      field: EditableField
      value: string
      mode: ApplyMode
    }
  | { type: 'batch_title_from_filename' }
  | { type: 'batch_filename_from_title' }
  | { type: 'dismiss_rejected'; id: string }
  | { type: 'process_start'; total: number }
  | { type: 'process_succeeded'; id: string; blob: Blob; outputFileName: string }
  | { type: 'process_failed'; id: string; code: PdfErrorCode }
  | { type: 'process_end'; success: number; failed: number }

function mapItem(
  state: EditorState,
  id: string,
  update: (item: PdfItem) => PdfItem,
): EditorState {
  return {
    ...state,
    items: state.items.map((item) => (item.id === id ? update(item) : item)),
  }
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case 'add_files':
      return {
        ...state,
        items: [...state.items, ...action.items],
        rejected: [...state.rejected, ...action.rejected],
        lastResult: null,
      }

    case 'file_loaded':
      return mapItem(state, action.id, (item) => ({
        ...item,
        pageCount: action.pageCount,
        originalMetadata: action.metadata,
        // A signed PDF loads fine but must not be re-saved, so it is surfaced
        // as a warning with no editable copy of the metadata.
        editedMetadata: action.hasSignature ? undefined : action.metadata,
        status: action.hasSignature ? 'warning' : 'ready',
        errorCode: action.hasSignature ? 'signed' : undefined,
      }))

    case 'file_failed':
      return mapItem(state, action.id, (item) => ({
        ...item,
        status: 'error',
        errorCode: action.code,
      }))

    case 'edit_field':
      return mapItem(state, action.id, (item) =>
        withField(item, action.field, action.value),
      )

    case 'edit_output_name':
      return mapItem(state, action.id, (item) =>
        withOutputName(item, action.value),
      )

    case 'reset_item':
      return mapItem(state, action.id, resetItem)

    case 'remove_item':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
      }

    case 'remove_all':
      return { ...initialState }

    case 'reset_all':
      return {
        ...state,
        items: state.items.map(resetItem),
        lastResult: null,
      }

    case 'batch_apply':
      return {
        ...state,
        items: applyBatch(state.items, action.field, action.value, action.mode),
        lastResult: null,
      }

    case 'batch_title_from_filename':
      return {
        ...state,
        items: applyTitleFromFileName(state.items),
        lastResult: null,
      }

    case 'batch_filename_from_title':
      return {
        ...state,
        items: applyFileNameFromTitle(state.items),
        lastResult: null,
      }

    case 'dismiss_rejected':
      return {
        ...state,
        rejected: state.rejected.filter((file) => file.id !== action.id),
      }

    case 'process_start':
      return {
        ...state,
        isProcessing: true,
        processedCount: 0,
        processTotal: action.total,
        lastResult: null,
      }

    case 'process_succeeded':
      return {
        ...mapItem(state, action.id, (item) => ({
          ...item,
          status: 'completed',
          outputBlob: action.blob,
          outputFileName: action.outputFileName,
          errorCode: undefined,
        })),
        processedCount: state.processedCount + 1,
      }

    case 'process_failed':
      return {
        ...mapItem(state, action.id, (item) => ({
          ...item,
          status: 'error',
          errorCode: action.code,
        })),
        processedCount: state.processedCount + 1,
      }

    // Counts come from the caller so a second run reports only its own
    // outcome rather than everything ever processed.
    case 'process_end':
      return {
        ...state,
        isProcessing: false,
        lastResult: { success: action.success, failed: action.failed },
      }

    default:
      return state
  }
}

// Items worth sending through generation: loaded and not blocked. Already
// completed items stay eligible so pressing the button again just rebuilds
// them rather than doing nothing.
export function processableItems(state: EditorState): PdfItem[] {
  return state.items.filter(
    (item) =>
      item.status === 'ready' ||
      item.status === 'modified' ||
      item.status === 'completed',
  )
}

export function completedItems(state: EditorState): PdfItem[] {
  return state.items.filter(
    (item) => item.status === 'completed' && item.outputBlob !== undefined,
  )
}

export function totalBytes(state: EditorState): number {
  return state.items.reduce((sum, item) => sum + item.size, 0)
}
