import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLocale } from '../i18n/locale'

export type LoadedFile = {
  id: string
  file: File
  previewUrl: string | null // object URL for image thumbnails, null for non-images
}

const THUMB_MIN = 24
const THUMB_MAX = 164
const THUMB_STEP = 20

type Props = {
  files: LoadedFile[]
  onChange: (files: LoadedFile[]) => void
  thumbSize: number
  onThumbSizeChange: (size: number) => void
}

export function FilesSection({
  files,
  onChange,
  thumbSize,
  onThumbSizeChange,
}: Props) {
  const { t } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const addFiles = (added: FileList | null) => {
    if (!added || added.length === 0) {
      return
    }
    const loaded = Array.from(added).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null,
    }))
    onChange([...files, ...loaded])
  }

  const removeFile = (id: string) => {
    const removed = files.find((f) => f.id === id)
    if (removed?.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl)
    }
    onChange(files.filter((f) => f.id !== id))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = files.findIndex((f) => f.id === active.id)
    const newIndex = files.findIndex((f) => f.id === over.id)
    if (oldIndex >= 0 && newIndex >= 0) {
      onChange(arrayMove(files, oldIndex, newIndex))
    }
  }

  return (
    <div>
      <div
        className={`dropzone${isDragOver ? ' dropzone-active' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        {t.upload.dropzone}
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <>
          <p className="hint">{t.upload.reorderHint}</p>
          <div className="thumb-size-control">
            <span id="thumb-size-label">{t.upload.thumbSizeLabel}</span>
            <button
              type="button"
              className="thumb-size-button"
              aria-describedby="thumb-size-label"
              aria-label={t.upload.thumbSmaller}
              disabled={thumbSize <= THUMB_MIN}
              onClick={() =>
                onThumbSizeChange(Math.max(THUMB_MIN, thumbSize - THUMB_STEP))
              }
            >
              −
            </button>
            <button
              type="button"
              className="thumb-size-button"
              aria-describedby="thumb-size-label"
              aria-label={t.upload.thumbLarger}
              disabled={thumbSize >= THUMB_MAX}
              onClick={() =>
                onThumbSizeChange(Math.min(THUMB_MAX, thumbSize + THUMB_STEP))
              }
            >
              ＋
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={files.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="file-list">
                {files.map((item, i) => (
                  <SortableFileItem
                    key={item.id}
                    item={item}
                    position={i + 1}
                    onRemove={removeFile}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  )
}

export function FileThumb({ file }: { file: LoadedFile }) {
  const { t } = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  if (!file.previewUrl) {
    return (
      <span className="thumb thumb-placeholder" aria-hidden="true">
        📄
      </span>
    )
  }
  return (
    <>
      <button
        type="button"
        className="thumb-button"
        aria-label={t.upload.openPreview(file.file.name)}
        onClick={() => setIsOpen(true)}
      >
        <img className="thumb" src={file.previewUrl} alt="" />
      </button>
      {isOpen && <Lightbox file={file} onClose={() => setIsOpen(false)} />}
    </>
  )
}

function Lightbox({ file, onClose }: { file: LoadedFile; onClose: () => void }) {
  const { t } = useLocale()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={file.file.name}
      onClick={onClose}
    >
      <figure className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={file.previewUrl ?? undefined} alt={file.file.name} />
        <figcaption>{file.file.name}</figcaption>
      </figure>
      <button
        type="button"
        className="lightbox-close"
        aria-label={t.upload.closePreview}
        onClick={onClose}
        autoFocus
      >
        ✕
      </button>
    </div>,
    document.body,
  )
}

function SortableFileItem({
  item,
  position,
  onRemove,
}: {
  item: LoadedFile
  position: number
  onRemove: (id: string) => void
}) {
  const { t } = useLocale()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  return (
    <li
      ref={setNodeRef}
      className={`file-item${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <span className="file-position">{position}</span>
      <FileThumb file={item} />
      <span className="file-name">{item.file.name}</span>
      <button
        type="button"
        className="remove-button"
        aria-label={t.upload.removeFile(item.file.name)}
        onClick={() => onRemove(item.id)}
      >
        ✕
      </button>
    </li>
  )
}
