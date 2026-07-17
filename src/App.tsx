import { useMemo, useState } from 'react'
import { applyRename } from './lib/rename'
import type { RenameToken } from './lib/types'
import { FilesSection, type LoadedFile } from './components/FilesSection'
import { RuleSection } from './components/RuleSection'
import { PreviewSection } from './components/PreviewSection'
import './App.css'

function App() {
  const [files, setFiles] = useState<LoadedFile[]>([])
  const [tokens, setTokens] = useState<RenameToken[]>([])

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

  return (
    <main>
      <header className="app-header">
        <h1>File Renamer</h1>
        <p>
          ブラウザ内で完結するファイル名一括変更ツール。
          ファイルはどこにも送信されません。
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
          <button type="button" className="confirm-button" disabled>
            確認してダウンロード
          </button>
          <p className="confirm-note">zipダウンロードは今後のタスクで実装予定です</p>
        </div>
      </section>
    </main>
  )
}

export default App
