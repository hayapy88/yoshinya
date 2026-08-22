import { useReducer, useState } from 'react'
import { useLocale } from '~/i18n/locale'
import { track } from '~/lib/analytics'
import { Dropzone } from './components/Dropzone'
import { FileCard } from './components/FileCard'
import { BatchActions } from './components/BatchActions'
import { ToolIntro } from '~/components/tool/ToolIntro'
import { ToolGuide } from '~/components/tool/ToolGuide'
import {
  completedItems,
  editorReducer,
  initialState,
  processableItems,
  totalBytes,
} from './lib/reducer'
import {
  currentMetadata,
  type ApplyMode,
  type EditableField,
} from './lib/edits'
import { normalizeTextField } from './lib/metadata'
import { PdfToolError, readPdf, writePdf } from './lib/pdf'
import { resolveDuplicateNames } from './lib/filename'
import { classifyFiles } from './lib/validate'
import { createPdfZip, zipFileName } from './lib/zip'
import type { PdfErrorCode, PdfItem, PdfMetadataForm } from './lib/types'
import './pdf-title-editor.css'

// Tagged on every analytics event so GA4 can segment by tool.
const TOOL = 'pdf-title-editor' as const

function toErrorCode(error: unknown): PdfErrorCode {
  return error instanceof PdfToolError ? error.code : 'write_failed'
}

// Trailing whitespace is fine to keep while typing but must not reach the file.
function forSaving(metadata: PdfMetadataForm): PdfMetadataForm {
  return {
    title: normalizeTextField(metadata.title),
    author: normalizeTextField(metadata.author),
    subject: normalizeTextField(metadata.subject),
    keywords: metadata.keywords,
  }
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

function PdfTitleEditorTool() {
  const { t } = useLocale()
  const [state, dispatch] = useReducer(editorReducer, initialState)
  const [zipError, setZipError] = useState<string | null>(null)

  const addFiles = (files: File[]) => {
    const { accepted, rejected } = classifyFiles(
      files,
      { count: state.items.length, bytes: totalBytes(state) },
      () => crypto.randomUUID(),
    )
    const items: PdfItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      sourceFile: file,
      originalFileName: file.name,
      outputFileName: file.name,
      size: file.size,
      status: 'loading',
    }))
    dispatch({ type: 'add_files', items, rejected })
    if (items.length > 0) {
      track('files_added', { tool: TOOL, file_count: items.length })
    }

    // Analysed one at a time: a hundred simultaneous arrayBuffer() calls would
    // spike memory for no gain.
    void (async () => {
      for (const item of items) {
        try {
          const result = await readPdf(item.sourceFile)
          dispatch({
            type: 'file_loaded',
            id: item.id,
            pageCount: result.pageCount,
            metadata: result.metadata,
            hasSignature: result.hasSignature,
          })
        } catch (error) {
          dispatch({
            type: 'file_failed',
            id: item.id,
            code: toErrorCode(error),
          })
        }
      }
    })()
  }

  const buildOne = async (item: PdfItem): Promise<Blob> =>
    writePdf(item.sourceFile, forSaving(currentMetadata(item)))

  const createSingle = async (item: PdfItem) => {
    dispatch({ type: 'process_start', total: 1 })
    try {
      const blob = await buildOne(item)
      dispatch({
        type: 'process_succeeded',
        id: item.id,
        blob,
        outputFileName: item.outputFileName,
      })
      downloadBlob(blob, item.outputFileName)
      dispatch({ type: 'process_end', success: 1, failed: 0 })
      track('download_completed', { tool: TOOL, file_count: 1 })
    } catch (error) {
      dispatch({
        type: 'process_failed',
        id: item.id,
        code: toErrorCode(error),
      })
      dispatch({ type: 'process_end', success: 0, failed: 1 })
    }
  }

  const createAll = async () => {
    const targets = processableItems(state)
    if (targets.length === 0) {
      return
    }
    if (targets.length === 1 && targets[0]) {
      await createSingle(targets[0])
      return
    }

    setZipError(null)
    dispatch({ type: 'process_start', total: targets.length })
    const built: { item: PdfItem; blob: Blob }[] = []
    let failed = 0

    for (const item of targets) {
      try {
        const blob = await buildOne(item)
        built.push({ item, blob })
        dispatch({
          type: 'process_succeeded',
          id: item.id,
          blob,
          outputFileName: item.outputFileName,
        })
      } catch (error) {
        failed += 1
        dispatch({
          type: 'process_failed',
          id: item.id,
          code: toErrorCode(error),
        })
      }
    }

    dispatch({ type: 'process_end', success: built.length, failed })

    // Whatever succeeded is still worth downloading, per the spec.
    if (built.length === 0) {
      return
    }
    try {
      const names = resolveDuplicateNames(
        built.map(({ item }) => item.outputFileName),
      )
      const blob = await createPdfZip(
        built.map(({ blob: pdf }, index) => ({
          name: names[index] ?? `document-${index + 1}.pdf`,
          blob: pdf,
        })),
      )
      downloadBlob(blob, zipFileName(new Date()))
      track('download_completed', { tool: TOOL, file_count: built.length })
    } catch (error) {
      setZipError(
        t.pdfTitleEditor.zipFailed(
          error instanceof Error ? error.message : String(error),
        ),
      )
    }
  }

  const removeAll = () => {
    if (
      state.items.length > 0 &&
      !window.confirm(t.pdfTitleEditor.removeAllConfirm)
    ) {
      return
    }
    dispatch({ type: 'remove_all' })
  }

  // A file still being parsed has no editable metadata yet, so a bulk action
  // aimed at it would quietly do nothing. Lock the controls until every file
  // has finished loading.
  const isLoading = state.items.some((item) => item.status === 'loading')
  const busy = state.isProcessing || isLoading
  const targets = processableItems(state)
  const ready = completedItems(state)
  const hasFiles = state.items.length > 0

  return (
    <main className="pte-root">
      <ToolIntro
        heading={t.pdfTitleEditorPage.heading}
        lead={t.pdfTitleEditorPage.lead}
        privacyNote={t.pdfTitleEditorPage.privacyNote}
      />

      <section className="pte-section" aria-labelledby="pte-add-heading">
        <h2 id="pte-add-heading">{t.pdfTitleEditor.addHeading}</h2>
        <Dropzone onFiles={addFiles} compact={hasFiles} />
        {!hasFiles && (
          <p className="pte-hint">{t.pdfTitleEditor.supportedFormats}</p>
        )}
      </section>

      {state.rejected.length > 0 && (
        <section className="pte-rejected" aria-live="polite">
          <h2>{t.pdfTitleEditor.rejectedHeading}</h2>
          <ul>
            {state.rejected.map((file) => (
              <li key={file.id}>
                <span className="pte-filename">{file.name}</span>{' '}
                <span>{t.pdfTitleEditor.errors[file.errorCode]}</span>
                <button
                  type="button"
                  className="pte-linkbtn"
                  onClick={() =>
                    dispatch({ type: 'dismiss_rejected', id: file.id })
                  }
                >
                  {t.pdfTitleEditor.dismiss}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {state.items.length > 1 && (
        <BatchActions
          items={state.items}
          disabled={busy}
          onApply={(field: EditableField, value: string, mode: ApplyMode) => {
            dispatch({ type: 'batch_apply', field, value, mode })
            track('batch_action', { tool: TOOL, action: field, mode })
          }}
          onTitleFromFileName={() =>
            dispatch({ type: 'batch_title_from_filename' })
          }
          onFileNameFromTitle={() =>
            dispatch({ type: 'batch_filename_from_title' })
          }
          onResetAll={() => dispatch({ type: 'reset_all' })}
          onRemoveAll={removeAll}
        />
      )}

      {hasFiles && (
        <section className="pte-section" aria-labelledby="pte-files-heading">
          <h2 id="pte-files-heading">
            {t.pdfTitleEditor.filesHeading(state.items.length)}
          </h2>
          <ul className="pte-cards">
            {state.items.map((item) => (
              <FileCard
                key={item.id}
                item={item}
                disabled={busy}
                onField={(field, value) =>
                  dispatch({ type: 'edit_field', id: item.id, field, value })
                }
                onOutputName={(value) =>
                  dispatch({ type: 'edit_output_name', id: item.id, value })
                }
                onReset={() => dispatch({ type: 'reset_item', id: item.id })}
                onRemove={() => dispatch({ type: 'remove_item', id: item.id })}
                onCreate={() => void createSingle(item)}
                showCreate={state.items.length > 1}
              />
            ))}
          </ul>
        </section>
      )}

      {hasFiles && (
        <section className="pte-run" aria-labelledby="pte-run-heading">
          <h2 id="pte-run-heading">{t.pdfTitleEditor.runHeading}</h2>
          <button
            type="button"
            className="pte-btn pte-btn-primary"
            onClick={() => void createAll()}
            disabled={busy || targets.length === 0}
          >
            {targets.length > 1
              ? t.pdfTitleEditor.createAll
              : t.pdfTitleEditor.createAndDownload}
          </button>

          <p className="pte-progress" role="status">
            {isLoading && t.pdfTitleEditor.readingFiles}
            {state.isProcessing &&
              t.pdfTitleEditor.processing(
                state.processedCount,
                state.processTotal,
              )}
            {!busy &&
              state.lastResult &&
              t.pdfTitleEditor.processed(
                state.lastResult.success,
                state.lastResult.failed,
              )}
            {!busy && !state.lastResult && targets.length === 0 && (
              <span className="pte-muted">{t.pdfTitleEditor.nothingToDo}</span>
            )}
          </p>

          {zipError && (
            <p className="pte-card-error" role="alert">
              {zipError}
            </p>
          )}

          {!busy && ready.length > 0 && (
            <p className="pte-hint">
              {t.pdfTitleEditor.keptAvailable(ready.length)}
            </p>
          )}
        </section>
      )}

      <ToolGuide guide={t.pdfTitleEditorGuide} current="pdf-title-editor" />
    </main>
  )
}

export default PdfTitleEditorTool
