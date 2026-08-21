import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useLocale } from '~/i18n/locale'
import { track } from '~/lib/analytics'
import { ToolIntro } from '~/components/tool/ToolIntro'
import { ToolGuide } from '~/components/tool/ToolGuide'
import { Dropzone } from './components/Dropzone'
import { CompareView } from './components/CompareView'
import { ImageList } from './components/ImageList'
import { SettingsPanel } from './components/SettingsPanel'
import {
  allDownloaded,
  compressorReducer,
  currentItem,
  downloadableItems,
  initialState,
  isRecoverableError,
  pendingCount,
} from './lib/reducer'
import { bulkTargetIds, nextUndownloadedIndex } from './lib/navigation'
import {
  effectiveSettings,
  hasOverride,
  mimeForFormat,
  needsBackground,
  resolveFormat,
  supportsQuality,
} from './lib/settings'
import { probeEncodableFormats } from './lib/support'
import { outputFileName, resolveDuplicateNames } from './lib/filename'
import { compareSize, formatBytes, formatPercent, totalComparison } from './lib/format'
import { classifyFiles } from './lib/validate'
import { EncodeQueue, isCancelled } from './lib/queue'
import { createImageZip, zipFileName } from './lib/zip'
import {
  LIMITS,
  type CompressionSettings,
  type EncodableFormat,
  type ImageItem,
} from './lib/types'
import './image-compressor.css'

const TOOL = 'image-compressor' as const

type Toast = { message: string; onUndo?: () => void; actionLabel?: string }

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

function ImageCompressorTool() {
  const { t } = useLocale()
  const [state, dispatch] = useReducer(compressorReducer, initialState)
  const [toast, setToast] = useState<Toast | null>(null)
  const [zipProgress, setZipProgress] = useState<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Full screen on a phone is a request to see the picture, so the settings
  // start out of the way. Above the narrow layout they float beside it and this
  // is ignored.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // null until the probe answers. Nothing is greyed out in the meantime: a
  // format briefly marked unavailable and then restored is worse than one
  // offered a moment before we can prove it works.
  const [encodableFormats, setEncodableFormats] =
    useState<ReadonlySet<EncodableFormat> | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  // Runs once, on the client only — the server has no canvas to ask.
  useEffect(() => {
    let active = true
    void probeEncodableFormats().then((formats) => {
      if (active) {
        setEncodableFormats(formats)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // An in-page overlay, not the Fullscreen API. The API hides the browser
  // chrome and adds the OS's own exit overlay and Esc handling on top of ours,
  // which is a different thing from what this needs — and it does not exist for
  // ordinary elements on iOS Safari at all. Squoosh does the same.
  const toggleFullscreen = () => {
    setIsFullscreen((v) => !v)
    // Leaving the sheet open would make the next entry start covered again.
    setIsSettingsOpen(false)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // The page scroll must not move under a full-screen overlay.
  useEffect(() => {
    if (!isFullscreen) {
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isFullscreen])

  // Created lazily and only in the browser: constructing a Worker during server
  // rendering would throw.
  const queueRef = useRef<EncodeQueue | null>(null)
  const getQueue = () => {
    queueRef.current ??= new EncodeQueue(
      () =>
        new Worker(new URL('./lib/encode.worker.ts', import.meta.url), {
          type: 'module',
        }),
    )
    return queueRef.current
  }

  // Object URLs are a manual allocation; without this a long session leaks the
  // full pixel data of every image the user ever loaded.
  const itemsRef = useRef<ImageItem[]>(state.items)
  itemsRef.current = state.items
  useEffect(
    () => () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.sourceUrl)
        if (item.outputUrl) {
          URL.revokeObjectURL(item.outputUrl)
        }
      }
      queueRef.current?.dispose()
    },
    [],
  )

  // Informational toasts fade; one carrying an undo does not. Re-encoding the
  // images a bulk apply just changed can easily outlast a timer, and an undo
  // that vanishes while the user is still checking the result is not an undo.
  useEffect(() => {
    if (!toast || toast.onUndo) {
      return
    }
    const id = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(id)
  }, [toast])

  const item = currentItem(state)
  const settings = item ? effectiveSettings(state.common, item) : state.common

  const addFiles = (files: File[]) => {
    const totalBytes = state.items.reduce((sum, i) => sum + i.sourceFile.size, 0)
    const { accepted, rejected } = classifyFiles(
      files,
      { count: state.items.length, bytes: totalBytes },
      () => crypto.randomUUID(),
    )
    const items: ImageItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      sourceFile: file,
      sourceUrl: URL.createObjectURL(file),
      sourceType: file.type || 'image/jpeg',
      sourceWidth: null,
      sourceHeight: null,
      outputBlob: null,
      outputUrl: null,
      outputWidth: null,
      outputHeight: null,
      settingsOverride: null,
      processingState: 'queued',
      downloaded: false,
      errorCode: null,
    }))
    dispatch({ type: 'add_files', items, rejected })
    if (items.length > 0) {
      track('files_added', { tool: TOOL, file_count: items.length })
    }
  }

  // Encoding loop: anything queued gets re-encoded, the visible image first.
  // Debounced because sliders emit continuously and only the value the user
  // stops on is worth spending an encode on.
  const encodeItem = useCallback(
    async (target: ImageItem, priority: number) => {
      const active = effectiveSettings(state.common, target)
      const format = resolveFormat(active.outputFormat, target.sourceType)
      dispatch({ type: 'encode_started', id: target.id })
      const response = await getQueue().encode({
        key: target.id,
        priority,
        file: target.sourceFile,
        mimeType: mimeForFormat(format),
        quality: active.quality,
        useQuality: supportsQuality(format),
        png:
          format === 'png' && active.pngReduce
            ? { colors: active.pngColors, dither: active.pngDither }
            : null,
        resize: {
          resizeEnabled: active.resizeEnabled,
          width: active.width,
          height: active.height,
          keepAspectRatio: active.keepAspectRatio,
          preventUpscale: active.preventUpscale,
        },
        background: needsBackground(format, target.sourceType)
          ? active.jpegBackground
          : null,
      })
      if (isCancelled(response)) {
        return
      }
      if (!response.ok) {
        dispatch({
          type: 'encode_failed',
          id: target.id,
          code:
            response.reason === 'memory'
              ? 'out_of_memory'
              : response.reason === 'decode'
                ? 'decode_failed'
                : response.reason === 'format'
                  ? 'format_unsupported'
                  : 'encode_failed',
        })
        track('tool_error' as never, { tool: TOOL, action: response.reason })
        return
      }
      // The output this one replaces, freed after the swap so the previous
      // result can stay on screen right up to the moment it is superseded.
      const superseded = itemsRef.current.find((i) => i.id === target.id)?.outputUrl
      dispatch({
        type: 'encode_succeeded',
        id: target.id,
        blob: response.blob,
        url: URL.createObjectURL(response.blob),
        width: response.width,
        height: response.height,
        sourceWidth: response.sourceWidth,
        sourceHeight: response.sourceHeight,
      })
      if (superseded) {
        URL.revokeObjectURL(superseded)
      }
    },
    [state.common],
  )

  useEffect(() => {
    const queued = state.items.filter((i) => i.processingState === 'queued')
    if (queued.length === 0) {
      return
    }
    const timer = window.setTimeout(() => {
      for (const target of queued) {
        void encodeItem(target, target.id === item?.id ? 10 : 0)
      }
    }, LIMITS.settingsDebounceMs)
    return () => window.clearTimeout(timer)
  }, [state.items, item?.id, encodeItem])

  const qualityTargets = useMemo(
    () => bulkTargetIds(state.items, state.currentIndex, state.common, 'quality'),
    [state.items, state.currentIndex, state.common],
  )
  const allTargets = useMemo(
    () => bulkTargetIds(state.items, state.currentIndex, state.common, 'all-settings'),
    [state.items, state.currentIndex, state.common],
  )

  const runBulk = (kind: 'quality' | 'all-settings') => {
    const targetIds = kind === 'quality' ? qualityTargets : allTargets
    if (targetIds.length === 0) {
      return
    }
    dispatch({ type: 'bulk_apply', kind, targetIds })
    track('batch_action', { tool: TOOL, action: kind, file_count: targetIds.length })
    setToast({
      message:
        kind === 'quality'
          ? t.imageCompressor.appliedQuality(settings.quality, targetIds.length)
          : t.imageCompressor.appliedAll(targetIds.length),
      onUndo: () => {
        dispatch({ type: 'undo_bulk' })
        track('batch_action', { tool: TOOL, action: 'undo' })
      },
    })
  }

  const changeCommon = (patch: Partial<CompressionSettings>) => {
    const keys = Object.keys(patch) as (keyof CompressionSettings)[]
    const pinned = state.items.filter((i) =>
      keys.some((key) => (i.settingsOverride ?? {})[key] !== undefined),
    )
    dispatch({ type: 'set_common', patch })
    if (pinned.length === 0) {
      setToast(null)
      return
    }
    const ids = pinned.map((i) => i.id)
    setToast({
      message: t.imageCompressor.notFollowed(pinned.length),
      actionLabel: t.imageCompressor.includeThem,
      onUndo: () => dispatch({ type: 'release_overrides', ids, keys }),
    })
  }

  const applyToAll = () => {
    const count = state.items.length
    if (count === 0 || !window.confirm(t.imageCompressor.applyToAllConfirm(count))) {
      return
    }
    dispatch({ type: 'apply_to_all' })
    track('batch_action', { tool: TOOL, action: 'apply-to-all', file_count: count })
    setToast({ message: t.imageCompressor.appliedToAll(count) })
  }

  const downloadCurrent = (advance: boolean) => {
    if (!item?.outputBlob || item.processingState !== 'ready') {
      return
    }
    const format = resolveFormat(settings.outputFormat, item.sourceType)
    download(item.outputBlob, outputFileName(item.sourceFile.name, format))
    dispatch({ type: 'mark_downloaded', ids: [item.id] })
    track('download_completed', { tool: TOOL, file_count: 1 })
    if (advance) {
      const next = nextUndownloadedIndex(
        state.items.map((i) => (i.id === item.id ? { ...i, downloaded: true } : i)),
        state.currentIndex,
      )
      if (next >= 0) {
        dispatch({ type: 'select_index', index: next })
      }
    }
  }

  const downloadZip = async () => {
    const ready = downloadableItems(state)
    if (ready.length === 0 || state.isZipping) {
      return
    }
    dispatch({ type: 'set_zipping', value: true })
    setZipProgress(0)
    try {
      const names = resolveDuplicateNames(
        ready.map((i) =>
          outputFileName(
            i.sourceFile.name,
            resolveFormat(effectiveSettings(state.common, i).outputFormat, i.sourceType),
          ),
        ),
      )
      const blob = await createImageZip(
        ready.map((i, index) => ({ name: names[index]!, blob: i.outputBlob! })),
        setZipProgress,
      )
      download(blob, zipFileName())
      dispatch({ type: 'mark_downloaded', ids: ready.map((i) => i.id) })
      track('download_completed', { tool: TOOL, file_count: ready.length })
      const skipped = state.items.length - ready.length
      if (skipped > 0) {
        setToast({ message: t.imageCompressor.zipSkipped(skipped) })
      }
    } catch (error) {
      setToast({
        message: t.imageCompressor.zipFailed(
          error instanceof Error ? error.message : String(error),
        ),
      })
    } finally {
      dispatch({ type: 'set_zipping', value: false })
      setZipProgress(null)
    }
  }

  const removeAll = () => {
    if (state.items.length > 0 && !window.confirm(t.imageCompressor.removeAllConfirm)) {
      return
    }
    for (const i of state.items) {
      URL.revokeObjectURL(i.sourceUrl)
      if (i.outputUrl) {
        URL.revokeObjectURL(i.outputUrl)
      }
    }
    dispatch({ type: 'remove_all' })
  }

  const busy = pendingCount(state) > 0
  const totals = totalComparison(state.items)
  const downloadedCount = state.items.filter((i) => i.downloaded).length
  const finished = allDownloaded(state)
  const isLast = item
    ? nextUndownloadedIndex(
        state.items.map((i) => (i.id === item.id ? { ...i, downloaded: true } : i)),
        state.currentIndex,
      ) < 0
    : false

  // Enter downloads and advances, the motion the whole tool is built around.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLSelectElement ||
        active instanceof HTMLButtonElement ||
        active instanceof HTMLTextAreaElement
      ) {
        return
      }
      if (event.key === 'ArrowLeft') {
        dispatch({ type: 'select_index', index: state.currentIndex - 1 })
      } else if (event.key === 'ArrowRight') {
        dispatch({ type: 'select_index', index: state.currentIndex + 1 })
      } else if (event.key === 'Enter' && item?.outputBlob) {
        downloadCurrent(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // Rendered either in the page column or inside the full-screen overlay,
  // never both: two copies would mean two elements sharing each control id,
  // which breaks every label association on the page.
  const settingsPanel = item ? (
    <SettingsPanel
      settings={settings}
      item={item}
      scope={state.scope}
      hasOverride={hasOverride(item)}
      bulkQualityCount={qualityTargets.length}
      bulkAllCount={allTargets.length}
      adjustedCount={state.items.filter((i) => i.settingsOverride !== null).length}
      totalCount={state.items.length}
      encodableFormats={encodableFormats}
      // Locked only when no setting could help. When the error names a way out
      // — "choose JPEG or PNG" — the control that offers it has to stay live.
      disabled={
        item.processingState === 'error' && !isRecoverableError(item.errorCode)
      }
      onScopeChange={(scope) => dispatch({ type: 'set_scope', scope })}
      onChange={(patch) => {
        if (state.scope === 'common') {
          changeCommon(patch)
        } else {
          dispatch({ type: 'set_current_override', patch })
        }
      }}
      onResetToCommon={() => dispatch({ type: 'reset_current_to_common' })}
      onApplyQualityToRest={() => runBulk('quality')}
      onApplyAllToRest={() => runBulk('all-settings')}
      onApplyToAll={applyToAll}
    />
  ) : null

  const size = item?.outputBlob
    ? compareSize(item.sourceFile.size, item.outputBlob.size)
    : null

  return (
    <main className="ic-root">
      <ToolIntro
        heading={t.imageCompressorPage.heading}
        lead={t.imageCompressorPage.lead}
        privacyNote={t.imageCompressorPage.privacyNote}
      />

      {state.items.length === 0 ? (
        <section className="ic-section">
          <Dropzone onFiles={addFiles} />
        </section>
      ) : (
        <>
          <div className="ic-topbar">
            <p className="ic-progress" role="status">
              {t.imageCompressor.progress(downloadedCount, state.items.length)}
              {totals.before > 0 && (
                <>
                  {' · '}
                  {formatBytes(totals.before)} → {formatBytes(totals.after)}
                  {' '}
                  <span className={totals.grew ? 'ic-grew' : 'ic-saved'}>
                    ({totals.grew ? '+' : '−'}
                    {formatPercent(totals.percent)})
                  </span>
                  {busy && ` ${t.imageCompressor.provisional}`}
                </>
              )}
            </p>
            <div className="ic-topbar-actions">
              <Dropzone onFiles={addFiles} compact />
              <button type="button" className="ic-linkbtn ic-remove" onClick={removeAll}>
                {t.imageCompressor.removeAll}
              </button>
            </div>
          </div>

          {state.rejected.length > 0 && (
            <section className="ic-rejected" aria-live="polite">
              <h2>{t.imageCompressor.rejectedHeading}</h2>
              <ul>
                {state.rejected.map((file) => (
                  <li key={file.id}>
                    <span className="ic-thumb-name">{file.name}</span>{' '}
                    <span>{t.imageCompressor.errors[file.errorCode]}</span>
                    <button
                      type="button"
                      className="ic-linkbtn"
                      onClick={() => dispatch({ type: 'dismiss_rejected', id: file.id })}
                    >
                      {t.imageCompressor.dismiss}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="ic-workspace">
            <ImageList
              items={state.items}
              currentIndex={state.currentIndex}
              filter={state.filter}
              onSelect={(index) => dispatch({ type: 'select_index', index })}
              onRemove={(id) => dispatch({ type: 'remove_item', id })}
              onFilterChange={(filter) => dispatch({ type: 'set_filter', filter })}
            />

            <div className="ic-main">
              {item && (
                <>
                  {item.processingState === 'error' ? (
                    <p className="ic-error" role="alert">
                      {t.imageCompressor.errors[item.errorCode ?? 'encode_failed']}
                    </p>
                  ) : (
                    // The wrapper is what goes full screen, so the comparison
                    // component keeps its zoom and divider across the switch.
                    <div
                      ref={viewerRef}
                      className={`ic-viewer${isFullscreen ? ' ic-fullscreen' : ''}`}
                    >
                      <CompareView
                        beforeUrl={item.sourceUrl}
                        afterUrl={item.outputUrl}
                        alt={item.sourceFile.name}
                        isBusy={item.processingState !== 'ready'}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={toggleFullscreen}
                        onToggleSettings={
                          isFullscreen
                            ? () => setIsSettingsOpen((v) => !v)
                            : undefined
                        }
                        isSettingsOpen={isSettingsOpen}
                      />
                      {isFullscreen && (
                        <div
                          className={`ic-fs-panel${isSettingsOpen ? '' : ' ic-fs-panel-closed'}`}
                        >
                          {/* Shown only in the narrow layout, where the sheet
                              covers the controls that would otherwise close it. */}
                          <div className="ic-fs-panel-head">
                            <button
                              type="button"
                              className="ic-fs-panel-close"
                              onClick={() => setIsSettingsOpen(false)}
                            >
                              {t.imageCompressor.hideSettings}
                            </button>
                          </div>
                          {settingsPanel}
                        </div>
                      )}
                      {isFullscreen && (
                        // Enough to keep working without leaving: judge the
                        // result, adjust the quality, save, move on.
                        <div className="ic-fs-bar">
                          <span className="ic-fs-name">{item.sourceFile.name}</span>
                          {size && (
                            <span className={size.grew ? 'ic-grew' : 'ic-saved'}>
                              {formatBytes(item.sourceFile.size)} →{' '}
                              {formatBytes(size.after)} (
                              {size.grew ? '+' : '−'}
                              {formatPercent(size.percent)})
                            </span>
                          )}
                          <button
                            type="button"
                            className="ic-btn ic-btn-primary ic-btn-small"
                            disabled={
                              !item.outputBlob || item.processingState !== 'ready'
                            }
                            onClick={() => downloadCurrent(true)}
                          >
                            {isLast
                              ? t.imageCompressor.downloadFinish
                              : t.imageCompressor.downloadNext}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="ic-sizes">
                    <span>{t.imageCompressor.beforeSize(formatBytes(item.sourceFile.size))}</span>
                    {size && (
                      <>
                        <span>{t.imageCompressor.afterSize(formatBytes(size.after))}</span>
                        <span className={size.grew ? 'ic-grew' : 'ic-saved'}>
                          {size.grew
                            ? t.imageCompressor.grewBy(formatPercent(size.percent))
                            : t.imageCompressor.savedBy(
                                formatBytes(size.savedBytes),
                                formatPercent(size.percent),
                              )}
                        </span>
                      </>
                    )}
                  </div>
                  {size?.grew && <p className="ic-warn">{t.imageCompressor.grewNote}</p>}

                  <div className="ic-actions">
                    <button
                      type="button"
                      className="ic-btn ic-btn-primary"
                      disabled={!item.outputBlob || item.processingState !== 'ready'}
                      onClick={() => downloadCurrent(true)}
                    >
                      {isLast
                        ? t.imageCompressor.downloadFinish
                        : t.imageCompressor.downloadNext}
                    </button>
                    <button
                      type="button"
                      className="ic-btn ic-btn-secondary"
                      disabled={!item.outputBlob || item.processingState !== 'ready'}
                      onClick={() => downloadCurrent(false)}
                    >
                      {t.imageCompressor.download}
                    </button>
                    <button
                      type="button"
                      className="ic-btn ic-btn-secondary"
                      disabled={state.isZipping || downloadableItems(state).length === 0}
                      onClick={() => void downloadZip()}
                    >
                      {state.isZipping
                        ? t.imageCompressor.zipping(Math.round(zipProgress ?? 0))
                        : t.imageCompressor.downloadZip}
                    </button>
                  </div>

                  {finished && <p className="ic-done">{t.imageCompressor.finished(state.items.length)}</p>}
                </>
              )}
            </div>

            {!isFullscreen && settingsPanel}
          </div>

          <p className="ic-hint ic-shortcuts">{t.imageCompressor.shortcuts}</p>
        </>
      )}

      {toast && (
        <div className="ic-toast" role="status">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <>
              <button
                type="button"
                onClick={() => {
                  toast.onUndo?.()
                  setToast(null)
                }}
              >
                {toast.actionLabel ?? t.imageCompressor.undo}
              </button>
              <button
                type="button"
                aria-label={t.imageCompressor.dismiss}
                onClick={() => setToast(null)}
              >
                ×
              </button>
            </>
          )}
        </div>
      )}

      <ToolGuide guide={t.imageCompressorGuide} current="image-compressor" />
    </main>
  )
}

export default ImageCompressorTool
