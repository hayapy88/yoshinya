import { useRef, useState } from 'react'
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

export type LoadedFile = {
  id: string
  file: File
}

type Props = {
  files: LoadedFile[]
  onChange: (files: LoadedFile[]) => void
}

export function FilesSection({ files, onChange }: Props) {
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
    }))
    onChange([...files, ...loaded])
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
        ここにファイルをドロップ、またはクリックして選択
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
          <p className="hint">ドラッグ&ドロップで並べ替えできます（この順序が連番の順になります）</p>
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
                    onRemove={(id) =>
                      onChange(files.filter((f) => f.id !== id))
                    }
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

function SortableFileItem({
  item,
  position,
  onRemove,
}: {
  item: LoadedFile
  position: number
  onRemove: (id: string) => void
}) {
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
      <span className="file-name">{item.file.name}</span>
      <button
        type="button"
        className="remove-button"
        aria-label={`${item.file.name} を削除`}
        onClick={() => onRemove(item.id)}
      >
        ✕
      </button>
    </li>
  )
}
