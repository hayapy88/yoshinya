import { useEffect, useMemo, useRef, useState } from 'react'
import { track } from '~/lib/analytics'
import { applyRename, formatDate, formatTime } from './lib/rename'
import { validateTextValue } from './lib/validate'
import { createZipBlob } from './lib/zip'
import type { RenameToken } from './lib/types'
import { useLocale } from '~/i18n/locale'
import { FilesSection, type LoadedFile } from './components/FilesSection'
import { RuleSection } from './components/RuleSection'
import { PreviewSection } from './components/PreviewSection'
import { ToolIntro } from '~/components/tool/ToolIntro'
import { ToolGuide } from '~/components/tool/ToolGuide'
import './file-renamer.css'

function FileRenamerTool() {
  const { t } = useLocale()
  const [files, setFiles] = useState<LoadedFile[]>([])
  const [tokens, setTokens] = useState<RenameToken[]>([])
  const [thumbSize, setThumbSize] = useState(44)
  const [isZipping, setIsZipping] = useState(false)
  const [zipError, setZipError] = useState<string | null>(null)

  const results = useMemo(() => {
    if (files.length === 0 || tokens.length === 0) {
      return null
    }
    return applyRename(
      files.map(({ file, width, height }) => ({
        originalName: file.name,
        lastModified: file.lastModified,
        width,
        height,
      })),
      tokens,
      { now: new Date() },
    )
  }, [files, tokens])

  // Load pixel dimensions for image files so the dimensions token can use them.
  // Done here (not in the add handler) with a functional state update so it
  // works regardless of how files were added and avoids racing on the list.
  const measuring = useRef(new Set<string>())
  useEffect(() => {
    for (const item of files) {
      if (
        !item.previewUrl ||
        item.width !== undefined ||
        measuring.current.has(item.id)
      ) {
        continue
      }
      measuring.current.add(item.id)
      const image = new Image()
      image.onload = () => {
        const { naturalWidth, naturalHeight } = image
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, width: naturalWidth, height: naturalHeight }
              : f,
          ),
        )
      }
      image.onerror = () => measuring.current.delete(item.id)
      image.src = item.previewUrl
    }
  }, [files])

  // Analytics events carry only counts — never file names or contents.
  const handleFilesChange = (next: LoadedFile[]) => {
    if (next.length > files.length) {
      track('files_added', {
        added: next.length - files.length,
        total: next.length,
      })
    }
    setFiles(next)
  }

  const hadPreview = useRef(false)
  useEffect(() => {
    if (results && !hadPreview.current) {
      hadPreview.current = true
      track('rename_preview_generated', { files: results.length })
    }
    if (!results) {
      hadPreview.current = false
    }
  }, [results])

  const hasTextError = tokens.some(
    (token) => token.kind === 'text' && validateTextValue(token.value) !== null,
  )
  const hasDuplicates = results?.some((r) => r.isDuplicate) ?? false

  const disabledReason =
    files.length === 0
      ? t.download.needFiles
      : tokens.length === 0
        ? t.download.needRule
        : hasTextError
          ? t.download.fixTextErrors
          : hasDuplicates
            ? t.download.duplicatesBlock
            : null

  const handleDownload = async () => {
    if (!results || disabledReason || isZipping) {
      return
    }
    setIsZipping(true)
    setZipError(null)
    try {
      const blob = await createZipBlob(
        results.map((r, i) => ({ name: r.newName, file: files[i].file })),
      )
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      const now = new Date()
      anchor.download = `renamed_${formatDate(now, 'yyyy-mm-dd')}-${formatTime(now, 'hh-mm-ss')}.zip`
      anchor.click()
      URL.revokeObjectURL(url)
      track('download_completed', { files: results.length })
    } catch (error) {
      setZipError(
        t.download.zipFailed(
          error instanceof Error ? error.message : String(error),
        ),
      )
    } finally {
      setIsZipping(false)
    }
  }

  return (
    <main style={{ '--thumb-size': `${thumbSize}px` } as React.CSSProperties}>
      <ToolIntro
        heading={t.fileRenamerPage.heading}
        lead={t.fileRenamerPage.lead}
        privacyNote={t.fileRenamerPage.privacyNote}
      />

      <section className="step">
        <h2>{t.steps.upload}</h2>
        <FilesSection
          files={files}
          onChange={handleFilesChange}
          thumbSize={thumbSize}
          onThumbSizeChange={setThumbSize}
        />
      </section>

      <section className="step">
        <h2>{t.steps.rule}</h2>
        <RuleSection tokens={tokens} onChange={setTokens} />
      </section>

      <section className="step">
        <h2>{t.steps.preview}</h2>
        <PreviewSection
          files={files}
          hasTokens={tokens.length > 0}
          results={results}
        />
        <div className="confirm-row">
          <button
            type="button"
            className="confirm-button"
            disabled={disabledReason !== null || isZipping}
            onClick={handleDownload}
          >
            {isZipping ? t.download.zipping : t.download.confirm}
          </button>
          {disabledReason && <p className="confirm-note">{disabledReason}</p>}
          {zipError && (
            <p className="confirm-error" role="alert">
              {zipError}
            </p>
          )}
        </div>
      </section>

      <ToolGuide guide={t.fileRenamerGuide} current="file-renamer" />
    </main>
  )
}

export default FileRenamerTool
