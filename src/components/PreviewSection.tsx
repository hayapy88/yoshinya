import type { RenameResult } from '../lib/types'

type Props = {
  hasFiles: boolean
  hasTokens: boolean
  results: RenameResult[] | null
}

export function PreviewSection({ hasFiles, hasTokens, results }: Props) {
  if (!hasFiles) {
    return <p className="hint">ファイルを追加するとプレビューが表示されます</p>
  }
  if (!hasTokens || !results) {
    return <p className="hint">リネーム規則を組み立てるとプレビューが表示されます</p>
  }

  const hasDuplicates = results.some((r) => r.isDuplicate)

  return (
    <div>
      {hasDuplicates && (
        <p className="duplicate-notice" role="alert">
          ⚠ 同名のファイルが発生します。indexトークンの追加などで名前が重複しないようにしてください。
        </p>
      )}
      <table className="preview-table">
        <thead>
          <tr>
            <th>元のファイル名</th>
            <th aria-hidden="true"></th>
            <th>新しいファイル名</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className={r.isDuplicate ? 'duplicate-row' : undefined}>
              <td>{r.originalName}</td>
              <td className="arrow">→</td>
              <td>
                {r.isDuplicate && <span aria-label="重複">⚠ </span>}
                {r.newName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
