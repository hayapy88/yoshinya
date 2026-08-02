import { useState } from 'react'
import { useLocale } from '~/i18n/locale'
import { countAffected, type ApplyMode, type EditableField } from '../lib/edits'
import type { PdfItem } from '../lib/types'

const FIELDS: EditableField[] = ['title', 'author', 'subject', 'keywords']

export function BatchActions({
  items,
  disabled,
  onApply,
  onTitleFromFileName,
  onFileNameFromTitle,
  onResetAll,
  onRemoveAll,
}: {
  items: PdfItem[]
  disabled: boolean
  onApply: (field: EditableField, value: string, mode: ApplyMode) => void
  onTitleFromFileName: () => void
  onFileNameFromTitle: () => void
  onResetAll: () => void
  onRemoveAll: () => void
}) {
  const { t } = useLocale()
  const [field, setField] = useState<EditableField>('author')
  const [value, setValue] = useState('')
  const [mode, setMode] = useState<ApplyMode>('all')

  // Shown before applying so "blank fields only" never looks like a no-op.
  const affected = countAffected(items, field, mode)

  return (
    <section className="pte-batch" aria-labelledby="pte-batch-heading">
      <h2 id="pte-batch-heading">{t.pdfTitleEditor.batchHeading}</h2>

      <div className="pte-batch-row">
        <button
          type="button"
          className="pte-btn pte-btn-secondary"
          onClick={onTitleFromFileName}
          disabled={disabled}
        >
          {t.pdfTitleEditor.titleFromFileName}
        </button>
        <button
          type="button"
          className="pte-btn pte-btn-secondary"
          onClick={onFileNameFromTitle}
          disabled={disabled}
        >
          {t.pdfTitleEditor.fileNameFromTitle}
        </button>
      </div>

      <div className="pte-batch-apply">
        <div className="pte-field">
          <label htmlFor="pte-batch-field">
            {t.pdfTitleEditor.batchFieldLabel}
          </label>
          <select
            id="pte-batch-field"
            value={field}
            disabled={disabled}
            onChange={(e) => setField(e.target.value as EditableField)}
          >
            {FIELDS.map((name) => (
              <option key={name} value={name}>
                {t.pdfTitleEditor[name]}
              </option>
            ))}
          </select>
        </div>

        <div className="pte-field pte-field-grow">
          <label htmlFor="pte-batch-value">
            {t.pdfTitleEditor.batchValueLabel}
          </label>
          <input
            id="pte-batch-value"
            type="text"
            value={value}
            disabled={disabled}
            placeholder={
              field === 'keywords'
                ? t.pdfTitleEditor.keywordsPlaceholder
                : undefined
            }
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <fieldset className="pte-modes" disabled={disabled}>
          <legend>{t.pdfTitleEditor.batchModeLabel}</legend>
          <label>
            <input
              type="radio"
              name="pte-batch-mode"
              value="all"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
            />
            {t.pdfTitleEditor.batchModeAll}
          </label>
          <label>
            <input
              type="radio"
              name="pte-batch-mode"
              value="blank"
              checked={mode === 'blank'}
              onChange={() => setMode('blank')}
            />
            {t.pdfTitleEditor.batchModeBlank}
          </label>
        </fieldset>

        <button
          type="button"
          className="pte-btn"
          disabled={disabled || affected === 0}
          onClick={() => onApply(field, value, mode)}
        >
          {t.pdfTitleEditor.applyToCount(affected)}
        </button>
      </div>

      <div className="pte-batch-row">
        <button
          type="button"
          className="pte-linkbtn"
          onClick={onResetAll}
          disabled={disabled}
        >
          {t.pdfTitleEditor.resetAll}
        </button>
        <button
          type="button"
          className="pte-linkbtn pte-remove"
          onClick={onRemoveAll}
          disabled={disabled}
        >
          {t.pdfTitleEditor.removeAll}
        </button>
      </div>
    </section>
  )
}
