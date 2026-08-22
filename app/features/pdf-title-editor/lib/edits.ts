import {
  fileNameFromTitle,
  resolveOutputName,
  titleFromFileName,
} from './filename'
import {
  emptyMetadata,
  normalizeTextField,
  parseKeywords,
  sanitizeInput,
} from './metadata'
import type { PdfItem, PdfMetadataForm } from './types'

export type EditableField = keyof PdfMetadataForm
export type ApplyMode = 'all' | 'blank'
// Everything a change marker can be attached to in the UI.
export type ChangeMarker = EditableField | 'outputFileName'

// Items that failed to load have nothing to edit and must survive every bulk
// action untouched.
export function isEditable(item: PdfItem): boolean {
  return item.status !== 'error' && item.editedMetadata !== undefined
}

export function currentMetadata(item: PdfItem): PdfMetadataForm {
  return item.editedMetadata ?? item.originalMetadata ?? emptyMetadata()
}

export function isBlankField(
  metadata: PdfMetadataForm,
  field: EditableField,
): boolean {
  const value = metadata[field]
  return Array.isArray(value) ? value.length === 0 : value === ''
}

// Exactly which values differ from the ones read out of the PDF. The card
// header and the per-field markers both read from this, so a row can never
// claim to be modified without showing where.
//
// Comparison is on the trimmed value: while typing, a field holds untrimmed
// text, and a lone trailing space is not a change worth flagging.
export function changedFields(item: PdfItem): Set<ChangeMarker> {
  const changed = new Set<ChangeMarker>()
  if (!isEditable(item)) {
    return changed
  }
  if (item.outputFileName !== item.originalFileName) {
    changed.add('outputFileName')
  }
  const original = item.originalMetadata
  if (!original) {
    return changed
  }
  const current = currentMetadata(item)
  for (const field of ['title', 'author', 'subject'] as const) {
    if (
      normalizeTextField(current[field]) !== normalizeTextField(original[field])
    ) {
      changed.add(field)
    }
  }
  const sameKeywords =
    current.keywords.length === original.keywords.length &&
    current.keywords.every((keyword, i) => keyword === original.keywords[i])
  if (!sameKeywords) {
    changed.add('keywords')
  }
  return changed
}

// Editing back to the original values should return the row to "unchanged"
// rather than leaving it permanently marked as modified.
function statusAfterEdit(item: PdfItem, next: PdfItem): PdfItem['status'] {
  if (item.status === 'error') {
    return 'error'
  }
  return changedFields(next).size === 0 ? 'ready' : 'modified'
}

function commit(item: PdfItem, patch: Partial<PdfItem>): PdfItem {
  const next: PdfItem = { ...item, ...patch, outputBlob: undefined }
  return { ...next, status: statusAfterEdit(item, next) }
}

export function withField(
  item: PdfItem,
  field: EditableField,
  value: string,
): PdfItem {
  if (!isEditable(item)) {
    return item
  }
  const metadata = currentMetadata(item)
  const next: PdfMetadataForm =
    field === 'keywords'
      ? { ...metadata, keywords: parseKeywords(value) }
      : { ...metadata, [field]: sanitizeInput(value) }
  return commit(item, { editedMetadata: next })
}

export function withOutputName(item: PdfItem, raw: string): PdfItem {
  if (item.status === 'error') {
    return item
  }
  return commit(item, {
    outputFileName: resolveOutputName(raw, item.originalFileName),
  })
}

export function resetItem(item: PdfItem): PdfItem {
  if (!isEditable(item)) {
    return item
  }
  return {
    ...item,
    editedMetadata: item.originalMetadata,
    outputFileName: item.originalFileName,
    outputBlob: undefined,
    status: 'ready',
  }
}

// Reported to the user before a bulk action runs, so "apply to blank only"
// never silently does nothing.
export function countAffected(
  items: PdfItem[],
  field: EditableField,
  mode: ApplyMode,
): number {
  return items.filter(
    (item) =>
      isEditable(item) &&
      (mode === 'all' || isBlankField(currentMetadata(item), field)),
  ).length
}

export function applyBatch(
  items: PdfItem[],
  field: EditableField,
  value: string,
  mode: ApplyMode,
): PdfItem[] {
  return items.map((item) => {
    if (!isEditable(item)) {
      return item
    }
    if (mode === 'blank' && !isBlankField(currentMetadata(item), field)) {
      return item
    }
    return withField(item, field, value)
  })
}

export function applyTitleFromFileName(items: PdfItem[]): PdfItem[] {
  return items.map((item) =>
    isEditable(item)
      ? withField(item, 'title', titleFromFileName(item.originalFileName))
      : item,
  )
}

export function applyFileNameFromTitle(items: PdfItem[]): PdfItem[] {
  return items.map((item) => {
    if (!isEditable(item)) {
      return item
    }
    const title = currentMetadata(item).title
    if (title === '') {
      return item
    }
    return withOutputName(item, fileNameFromTitle(title, item.originalFileName))
  })
}
