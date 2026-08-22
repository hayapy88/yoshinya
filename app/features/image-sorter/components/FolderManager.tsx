import { useLocale } from '~/i18n/locale'
import type { SortingFolder, SortingState } from '../lib/types'

// The setup-screen folder editor: add, rename, delete folders (numbered by order).
export function FolderManager({
  state,
  onAdd,
  onRename,
  onRequestDelete,
}: {
  state: SortingState
  onAdd: () => void
  onRename: (folderId: string, name: string) => void
  onRequestDelete: (folder: SortingFolder) => void
}) {
  const { t } = useLocale()
  const ordered = [...state.folders].sort((a, b) => a.order - b.order)

  const duplicateNames = new Set(
    ordered
      .map((folder) => folder.name.trim().toLowerCase())
      .filter((name, index, arr) => name && arr.indexOf(name) !== index),
  )

  return (
    <div>
      <p className="is-hint">{t.imageSorter.foldersHint}</p>
      <div className="is-folders">
        {ordered.map((folder, index) => {
          const name = folder.name.trim()
          const error = !name
            ? t.imageSorter.folderNameEmpty
            : duplicateNames.has(name.toLowerCase())
              ? t.imageSorter.folderNameDuplicate
              : null
          return (
            <div key={folder.id}>
              <div className="is-folder-row">
                <span className="is-folder-num" aria-hidden="true">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={folder.name}
                  aria-label={t.imageSorter.folderNamePlaceholder}
                  placeholder={t.imageSorter.folderNamePlaceholder}
                  onChange={(e) => onRename(folder.id, e.target.value)}
                />
                <button
                  type="button"
                  className="is-icon-btn"
                  aria-label={t.imageSorter.deleteFolder(folder.name)}
                  onClick={() => onRequestDelete(folder)}
                >
                  ✕
                </button>
              </div>
              {error && (
                <p className="is-field-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: '0.75rem' }}>
        <button
          type="button"
          className="is-btn is-btn-secondary"
          onClick={onAdd}
        >
          ＋ {t.imageSorter.addFolder}
        </button>
      </div>
    </div>
  )
}
