import { useEffect, useRef, useState } from 'react'
import { useLocale } from '~/i18n/locale'
import type { SortingState } from '../lib/types'
import { folderNumber, counts } from '../lib/reducer'

const NUMBER_KEY_LIMIT = 9
const SWIPE_THRESHOLD = 50
const ZOOM_STEP = 0.5
const ZOOM_MAX = 4

type Props = {
  state: SortingState
  onSort: (folderId: string) => void
  onRepeatLast: () => void
  onNav: (delta: number) => void
  onUndo: () => void
  onReview: () => void
  onSkipCurrent: (imageId: string) => void
  onImageError: (imageId: string) => void
}

// True when a global shortcut should be ignored because the user is typing or
// interacting with a control.
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function SortingView({
  state,
  onSort,
  onRepeatLast,
  onNav,
  onUndo,
  onReview,
  onSkipCurrent,
  onImageError,
}: Props) {
  const { t } = useLocale()
  const ordered = [...state.folders].sort((a, b) => a.order - b.order)
  const current = state.images[state.currentIndex]
  const { total, sorted, unsorted } = counts(state)

  const [scale, setScale] = useState(1)
  const swipeStart = useRef<number | null>(null)

  // Reset zoom whenever the image changes to avoid a confusing carried-over
  // zoom state.
  useEffect(() => {
    setScale(1)
  }, [state.currentIndex])

  // Global keyboard shortcuts, active only while the sorting view is mounted.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) {
        return
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault()
          onUndo()
        }
        return
      }
      if (e.altKey) {
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onNav(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNav(1)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        onUndo()
      } else if (e.key === ' ') {
        e.preventDefault()
        onRepeatLast()
      } else if (/^[1-9]$/.test(e.key)) {
        const folder = ordered[Number(e.key) - 1]
        if (folder) {
          e.preventDefault()
          onSort(folder.id)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [ordered, onSort, onNav, onUndo, onRepeatLast])

  if (!current) {
    return null
  }

  const currentFolder = current.folderId
    ? ordered.find((folder) => folder.id === current.folderId)
    : null

  return (
    <div className="is-sort">
      {/* Progress */}
      <div className="is-progress" aria-live="polite">
        <span className="is-current">
          {t.imageSorter.position(state.currentIndex + 1, total)}
        </span>
        <span>{t.imageSorter.sortedCount(sorted)}</span>
        <span>{t.imageSorter.remainingCount(unsorted)}</span>
        <span>
          {currentFolder
            ? t.imageSorter.inFolder(currentFolder.name)
            : t.imageSorter.unsortedLabel}
        </span>
      </div>

      {/* Image stage */}
      <div
        className="is-stage"
        onWheel={(e) => {
          e.preventDefault()
          setScale((s) =>
            Math.min(ZOOM_MAX, Math.max(1, s - Math.sign(e.deltaY) * ZOOM_STEP)),
          )
        }}
        onPointerDown={(e) => {
          if (scale === 1) {
            swipeStart.current = e.clientX
          }
        }}
        onPointerUp={(e) => {
          const start = swipeStart.current
          swipeStart.current = null
          if (start === null) {
            return
          }
          const delta = e.clientX - start
          if (Math.abs(delta) > SWIPE_THRESHOLD) {
            onNav(delta < 0 ? 1 : -1)
          }
        }}
      >
        <span className="is-stage-badge">
          {currentFolder ? currentFolder.name : t.imageSorter.unsortedLabel}
        </span>
        <div className="is-zoom">
          <button
            type="button"
            aria-label={t.imageSorter.zoomOut}
            onClick={() => setScale((s) => Math.max(1, s - ZOOM_STEP))}
          >
            −
          </button>
          <button
            type="button"
            aria-label={t.imageSorter.resetZoom}
            onClick={() => setScale(1)}
          >
            ⤢
          </button>
          <button
            type="button"
            aria-label={t.imageSorter.zoomIn}
            onClick={() => setScale((s) => Math.min(ZOOM_MAX, s + ZOOM_STEP))}
          >
            ＋
          </button>
        </div>
        {current.error ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p className="is-error">{t.imageSorter.imageLoadError}</p>
            <button
              type="button"
              className="is-btn is-btn-secondary"
              onClick={() => onSkipCurrent(current.id)}
            >
              {t.imageSorter.skipImage}
            </button>
          </div>
        ) : (
          <img
            src={current.previewUrl}
            alt={current.name}
            style={{ transform: `scale(${scale})` }}
            onError={() => onImageError(current.id)}
          />
        )}
      </div>
      <p className="is-filename">{current.name}</p>

      {/* Folder buttons — primary controls on touch, secondary on desktop */}
      <div>
        <div
          className="is-folder-buttons"
          role="group"
          aria-label={t.imageSorter.foldersHeading}
        >
          {ordered.map((folder) => {
            const num = folderNumber(state.folders, folder.id)
            return (
              <button
                key={folder.id}
                type="button"
                className={`is-folder-button${
                  current.folderId === folder.id ? ' is-active' : ''
                }`}
                onClick={() => onSort(folder.id)}
              >
                <span className="is-fb-num" aria-hidden="true">
                  {num <= NUMBER_KEY_LIMIT ? num : '•'}
                </span>
                <span className="is-fb-name">{folder.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="is-nav">
        <button
          type="button"
          className="is-btn is-btn-secondary"
          onClick={() => onNav(-1)}
          disabled={state.currentIndex === 0}
        >
          ← {t.imageSorter.prev}
        </button>
        <button
          type="button"
          className="is-btn is-btn-secondary"
          onClick={onUndo}
          disabled={state.history.length === 0}
        >
          ↩ {t.imageSorter.undo}
        </button>
        <button
          type="button"
          className="is-btn is-btn-secondary"
          onClick={() => onNav(1)}
          disabled={state.currentIndex >= total - 1}
        >
          {t.imageSorter.next} →
        </button>
      </div>

      {/* Keyboard reference: collapsed by default; hidden on touch via CSS. */}
      <details className="is-keys">
        <summary>{t.imageSorter.keyboardHeading}</summary>
        <ul>
          <li>{t.imageSorter.keyNumber}</li>
          <li>{t.imageSorter.keySpace}</li>
          <li>{t.imageSorter.keyArrows}</li>
          <li>{t.imageSorter.keyUndo}</li>
          {ordered.length > NUMBER_KEY_LIMIT && (
            <li>{t.imageSorter.overNineHint}</li>
          )}
        </ul>
      </details>

      {unsorted === 0 && <p className="is-hint">{t.imageSorter.allSorted}</p>}

      <div className="is-actions" style={{ justifyContent: 'center' }}>
        <button type="button" className="is-btn" onClick={onReview}>
          {t.imageSorter.goToReview}
        </button>
      </div>
    </div>
  )
}
