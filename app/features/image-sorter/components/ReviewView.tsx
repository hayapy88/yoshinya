import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useLocale } from '~/i18n/locale'
import type { ImageItem, SortingState } from '../lib/types'
import { folderNumber, counts } from '../lib/reducer'

type Props = {
  state: SortingState
  onMove: (imageIds: string[], folderId: string | null) => void
  onBackToSorting: () => void
  onDownload: () => void
  isZipping: boolean
  zipError: string | null
}

type Group = {
  id: string | null // null = unsorted
  dropId: string // droppable id ('__unsorted__' or folderId)
  name: string
  number: number | null
  images: ImageItem[]
}

const UNSORTED_DROP = '__unsorted__'

// One selectable + draggable image row.
function ImageRow({
  image,
  isSelected,
  isDragging,
  onToggle,
}: {
  image: ImageItem
  isSelected: boolean
  isDragging: boolean
  onToggle: (image: ImageItem, shiftKey: boolean) => void
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: image.id })
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      className={`is-row${isSelected ? ' is-selected' : ''}${
        isDragging ? ' is-dragging' : ''
      }`}
      aria-pressed={isSelected}
      onClick={(e) => onToggle(image, e.shiftKey)}
    >
      <span className="is-row-check" aria-hidden="true">
        {isSelected ? '✓' : ''}
      </span>
      <img
        className="is-row-thumb"
        src={image.previewUrl}
        alt=""
        loading="lazy"
      />
      <span className="is-row-name">{image.name}</span>
    </button>
  )
}

// A folder (or unsorted) section that accepts dropped images.
function FolderGroup({
  group,
  children,
}: {
  group: Group
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.dropId })
  return (
    <div
      ref={setNodeRef}
      className={`is-group${group.id === null ? ' is-group-unsorted' : ''}${
        isOver ? ' is-drop-over' : ''
      }`}
    >
      {children}
    </div>
  )
}

export function ReviewView({
  state,
  onMove,
  onBackToSorting,
  onDownload,
  isZipping,
  zipError,
}: Props) {
  const { t } = useLocale()
  const ordered = [...state.folders].sort((a, b) => a.order - b.order)
  const { total, sorted, unsorted } = counts(state)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [target, setTarget] = useState<string>('') // folderId or '__unsorted__'
  const [lastClicked, setLastClicked] = useState<number | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // Press-and-hold on touch so normal scrolling still works; small move on mouse.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  )

  // Groups top to bottom: unsorted first (only if it has images), then every
  // folder in order (even empty ones, so the structure stays visible).
  const groups: Group[] = useMemo(() => {
    const unsortedImages = state.images.filter((i) => i.folderId === null)
    const folderGroups: Group[] = ordered.map((folder) => ({
      id: folder.id,
      dropId: folder.id,
      name: folder.name,
      number: folderNumber(state.folders, folder.id),
      images: state.images.filter((i) => i.folderId === folder.id),
    }))
    // The unsorted group is always shown (even when empty) so images can be
    // dragged back to it.
    return [
      {
        id: null,
        dropId: UNSORTED_DROP,
        name: t.imageSorter.unsortedLabel,
        number: null,
        images: unsortedImages,
      },
      ...folderGroups,
    ]
  }, [state.images, state.folders, ordered, t])

  const flat = useMemo(() => groups.flatMap((g) => g.images), [groups])

  // Images that a drag will move: the whole selection if the dragged image is
  // selected, otherwise just the dragged image.
  const dragImageIds = (draggedId: string): string[] =>
    selected.has(draggedId) ? [...selected] : [draggedId]

  const draggingIds = new Set(activeDragId ? dragImageIds(activeDragId) : [])

  const toggle = (image: ImageItem, shiftKey: boolean) => {
    const index = flat.findIndex((i) => i.id === image.id)
    setSelected((prev) => {
      const next = new Set(prev)
      if (shiftKey && lastClicked !== null) {
        const [from, to] = [lastClicked, index].sort((a, b) => a - b)
        for (let i = from; i <= to; i += 1) {
          if (flat[i]) {
            next.add(flat[i].id)
          }
        }
      } else if (next.has(image.id)) {
        next.delete(image.id)
      } else {
        next.add(image.id)
      }
      return next
    })
    setLastClicked(index)
  }

  const applyMove = () => {
    if (selected.size === 0 || target === '') {
      return
    }
    onMove([...selected], target === UNSORTED_DROP ? null : target)
    setSelected(new Set())
  }

  const handleDragStart = (event: DragStartEvent) =>
    setActiveDragId(String(event.active.id))

  const handleDragEnd = (event: DragEndEvent) => {
    const draggedId = activeDragId
    setActiveDragId(null)
    if (!event.over || !draggedId) {
      return
    }
    const ids = dragImageIds(draggedId)
    const folderId =
      event.over.id === UNSORTED_DROP ? null : String(event.over.id)
    onMove(ids, folderId)
    if (selected.has(draggedId)) {
      setSelected(new Set())
    }
  }

  const activeCount = activeDragId ? dragImageIds(activeDragId).length : 0
  const activeImage = activeDragId
    ? state.images.find((i) => i.id === activeDragId)
    : null

  return (
    <div>
      <h2>{t.imageSorter.reviewHeading}</h2>
      <p className="is-progress" style={{ justifyContent: 'flex-start' }}>
        <span>{t.imageSorter.sortedCount(sorted)}</span>
        <span>{t.imageSorter.remainingCount(unsorted)}</span>
        <span>{t.imageSorter.position(sorted, total)}</span>
      </p>

      {/* Selection toolbar — the primary, keyboard- and touch-friendly path */}
      <div className="is-review-bar">
        <span>{t.imageSorter.selectedCount(selected.size)}</span>
        <button
          type="button"
          className="is-btn is-btn-secondary"
          onClick={() => setSelected(new Set(flat.map((i) => i.id)))}
          disabled={flat.length === 0}
        >
          {t.imageSorter.selectAll}
        </button>
        <button
          type="button"
          className="is-btn is-btn-secondary"
          onClick={() => setSelected(new Set())}
          disabled={selected.size === 0}
        >
          {t.imageSorter.clearSelection}
        </button>
        <select
          value={target}
          aria-label={t.imageSorter.moveTo}
          onChange={(e) => setTarget(e.target.value)}
        >
          <option value="">{t.imageSorter.moveTo}</option>
          {ordered.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folderNumber(state.folders, folder.id)}. {folder.name}
            </option>
          ))}
          <option value={UNSORTED_DROP}>{t.imageSorter.moveToUnsorted}</option>
        </select>
        <button
          type="button"
          className="is-btn"
          onClick={applyMove}
          disabled={selected.size === 0 || target === ''}
        >
          {t.imageSorter.move}
        </button>
      </div>
      <p className="is-hint">{t.imageSorter.dragHint}</p>

      {/* Grouped, per-folder lists with drag-and-drop between folders */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        {groups.map((group) => (
          <FolderGroup key={group.dropId} group={group}>
            <div className="is-group-head">
              {group.number !== null && (
                <span className="is-folder-num" aria-hidden="true">
                  {group.number}
                </span>
              )}
              <h3>{group.name}</h3>
              <span className="is-group-count">
                {t.imageSorter.imageCount(group.images.length)}
              </span>
            </div>
            {group.images.length === 0 ? (
              <p className="is-group-empty">{t.imageSorter.emptyFilter}</p>
            ) : (
              group.images.map((image) => (
                <ImageRow
                  key={image.id}
                  image={image}
                  isSelected={selected.has(image.id)}
                  isDragging={draggingIds.has(image.id)}
                  onToggle={toggle}
                />
              ))
            )}
          </FolderGroup>
        ))}

        <DragOverlay>
          {activeImage && (
            <div className="is-drag-overlay">
              <img src={activeImage.previewUrl} alt="" />
              <span>
                {activeCount > 1
                  ? t.imageSorter.imageCount(activeCount)
                  : activeImage.name}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Download */}
      <div className="is-actions">
        <button
          type="button"
          className="is-btn is-btn-secondary"
          onClick={onBackToSorting}
        >
          {t.imageSorter.backToSorting}
        </button>
        <button
          type="button"
          className="is-btn"
          onClick={onDownload}
          disabled={isZipping || sorted === 0}
        >
          {isZipping ? t.imageSorter.zipping : t.imageSorter.download}
        </button>
        {sorted === 0 && (
          <span className="is-hint">{t.imageSorter.noSortedImages}</span>
        )}
      </div>
      {zipError && (
        <p className="is-error" role="alert">
          {zipError}
        </p>
      )}
    </div>
  )
}
