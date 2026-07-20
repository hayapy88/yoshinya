import type { RenameResult } from '../lib/types'
import { useLocale } from '~/i18n/locale'
import { FileThumb, type LoadedFile } from './FilesSection'

type Props = {
  files: LoadedFile[]
  hasTokens: boolean
  results: RenameResult[] | null
}

export function PreviewSection({ files, hasTokens, results }: Props) {
  const { t } = useLocale()

  if (files.length === 0) {
    return <p className="hint">{t.preview.addFilesGuide}</p>
  }
  if (!hasTokens || !results) {
    return <p className="hint">{t.preview.buildRuleGuide}</p>
  }

  const hasDuplicates = results.some((r) => r.isDuplicate)

  return (
    <div>
      {hasDuplicates && (
        <p className="duplicate-notice" role="alert">
          {t.preview.duplicateNotice}
        </p>
      )}
      <table className="preview-table">
        <thead>
          <tr>
            <th aria-hidden="true"></th>
            <th>{t.preview.originalName}</th>
            <th aria-hidden="true"></th>
            <th>{t.preview.newName}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className={r.isDuplicate ? 'duplicate-row' : undefined}>
              <td className="thumb-cell">
                {files[i] && <FileThumb file={files[i]} />}
              </td>
              <td>{r.originalName}</td>
              <td className="arrow">→</td>
              <td>
                {r.isDuplicate && (
                  <span aria-label={t.preview.duplicate}>⚠ </span>
                )}
                {r.newName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
