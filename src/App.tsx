import { useMemo, useState } from 'react'
import { applyRename, formatDate } from './lib/rename'
import { validateTextValue } from './lib/validate'
import { createZipBlob } from './lib/zip'
import type { RenameToken } from './lib/types'
import { FilesSection, type LoadedFile } from './components/FilesSection'
import { RuleSection } from './components/RuleSection'
import { PreviewSection } from './components/PreviewSection'
import './App.css'

function App() {
  const [files, setFiles] = useState<LoadedFile[]>([])
  const [tokens, setTokens] = useState<RenameToken[]>([])
  const [isZipping, setIsZipping] = useState(false)
  const [zipError, setZipError] = useState<string | null>(null)

  const results = useMemo(() => {
    if (files.length === 0 || tokens.length === 0) {
      return null
    }
    return applyRename(
      files.map(({ file }) => ({
        originalName: file.name,
        lastModified: file.lastModified,
      })),
      tokens,
      { now: new Date() },
    )
  }, [files, tokens])

  const hasTextError = tokens.some(
    (t) => t.kind === 'text' && validateTextValue(t.value) !== null,
  )
  const hasDuplicates = results?.some((r) => r.isDuplicate) ?? false

  const disabledReason =
    files.length === 0
      ? 'ファイルを追加するとダウンロードできます'
      : tokens.length === 0
        ? 'リネーム規則を組み立てるとダウンロードできます'
        : hasTextError
          ? '任意文字列のエラーを解消してください'
          : hasDuplicates
            ? '同名のファイルが発生するためダウンロードできません'
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
      anchor.download = `renamed_${formatDate(new Date(), 'yyyy-mm-dd')}.zip`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setZipError(
        `zipの生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setIsZipping(false)
    }
  }

  return (
    <main>
      <header className="app-header">
        <h1>File Renamer</h1>
        <p>
          複数ファイルの名前をルールに沿って一括変更し、zipでダウンロードできるツールです。
          ファイルはサーバーに送信されず、すべてブラウザ内で処理されます。
        </p>
      </header>

      <section className="step">
        <h2>① ファイルのアップロード</h2>
        <FilesSection files={files} onChange={setFiles} />
      </section>

      <section className="step">
        <h2>② リネーム規則の組み立て</h2>
        <RuleSection tokens={tokens} onChange={setTokens} />
      </section>

      <section className="step">
        <h2>③ 新ファイル名のプレビュー</h2>
        <PreviewSection
          hasFiles={files.length > 0}
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
            {isZipping ? 'zipを生成中…' : '確認してダウンロード'}
          </button>
          {disabledReason && <p className="confirm-note">{disabledReason}</p>}
          {zipError && (
            <p className="confirm-error" role="alert">
              {zipError}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
