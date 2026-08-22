import { useLocale } from '~/i18n/locale';
import {
  changedFields,
  currentMetadata,
  isEditable,
  type ChangeMarker,
  type EditableField,
} from '../lib/edits';
import { formatKeywords } from '../lib/metadata';
import { formatBytes } from '../lib/format';
import { LIMITS, type PdfItem } from '../lib/types';

// Status is never signalled by colour alone: every state carries a symbol and
// a word.
const STATUS_MARK: Record<PdfItem['status'], string> = {
  loading: '…',
  ready: '–',
  modified: '●',
  processing: '…',
  completed: '✓',
  warning: '!',
  error: '×',
};

export function FileCard({
  item,
  onField,
  onOutputName,
  onReset,
  onRemove,
  onCreate,
  disabled,
  showCreate,
}: {
  item: PdfItem;
  onField: (field: EditableField, value: string) => void;
  onOutputName: (value: string) => void;
  onReset: () => void;
  onRemove: () => void;
  onCreate: () => void;
  disabled: boolean;
  // Hidden when this is the only file: the button at the bottom of the page
  // already does exactly the same thing.
  showCreate: boolean;
}) {
  const { t } = useLocale();
  const metadata = currentMetadata(item);
  const editable = isEditable(item) && !disabled;
  const changed = changedFields(item);
  const fieldId = (name: string) => `pte-${item.id}-${name}`;

  // The dot marks which value differs. Presence of the glyph carries the
  // meaning, not its colour, and it is labelled for screen readers.
  const marker = (field: ChangeMarker) =>
    changed.has(field) ? (
      <span
        className="pte-changed"
        role="img"
        aria-label={t.pdfTitleEditor.changedMarker}
      >
        ●
      </span>
    ) : null;

  const otherChanged = (['author', 'subject', 'keywords'] as const).some(
    (field) => changed.has(field),
  );

  return (
    <li className={`pte-card pte-card-${item.status}`}>
      <div className="pte-card-head">
        <div className="pte-card-id">
          <p className="pte-filename" title={item.originalFileName}>
            {item.originalFileName}
          </p>
          <p className="pte-meta">
            {formatBytes(item.size)}
            {item.pageCount !== undefined && (
              <> · {t.pdfTitleEditor.pages(item.pageCount)}</>
            )}
          </p>
        </div>
        <span className={`pte-status pte-status-${item.status}`}>
          <span aria-hidden="true" className="pte-status-mark">
            {STATUS_MARK[item.status]}
          </span>{' '}
          {t.pdfTitleEditor.status[item.status]}
        </span>
      </div>

      {item.errorCode && (
        <p className="pte-card-error" role="alert">
          {t.pdfTitleEditor.errors[item.errorCode]}
        </p>
      )}

      {item.originalMetadata && (
        <p className="pte-current-title">
          <span className="pte-current-title-label">
            {t.pdfTitleEditor.currentTitle}
          </span>{' '}
          {item.originalMetadata.title === '' ? (
            <em className="pte-muted">{t.pdfTitleEditor.noTitle}</em>
          ) : (
            item.originalMetadata.title
          )}
        </p>
      )}

      {isEditable(item) && (
        <>
          <div className="pte-field">
            <label htmlFor={fieldId('title')}>
              {t.pdfTitleEditor.newTitle}
              {marker('title')}
            </label>
            <input
              id={fieldId('title')}
              type="text"
              value={metadata.title}
              maxLength={LIMITS.maxTextLength}
              disabled={!editable}
              placeholder={t.pdfTitleEditor.titlePlaceholder}
              onChange={(e) => onField('title', e.target.value)}
            />
          </div>

          <div className="pte-field">
            <label htmlFor={fieldId('output')}>
              {t.pdfTitleEditor.outputFileName}
              {marker('outputFileName')}
            </label>
            <input
              id={fieldId('output')}
              type="text"
              defaultValue={item.outputFileName}
              key={item.outputFileName}
              disabled={!editable}
              onBlur={(e) => onOutputName(e.target.value)}
            />
            <p className="pte-hint">{t.pdfTitleEditor.outputFileNameHint}</p>
          </div>

          <details className="pte-details">
            {/* The marker repeats on the summary so a change hidden inside a
                collapsed section is still visible. */}
            <summary>
              {t.pdfTitleEditor.otherMetadata}
              {otherChanged && (
                <span
                  className="pte-changed"
                  role="img"
                  aria-label={t.pdfTitleEditor.changedMarker}
                >
                  ●
                </span>
              )}
            </summary>
            <div className="pte-field">
              <label htmlFor={fieldId('author')}>
                {t.pdfTitleEditor.author}
                {marker('author')}
              </label>
              <input
                id={fieldId('author')}
                type="text"
                value={metadata.author}
                maxLength={LIMITS.maxTextLength}
                disabled={!editable}
                onChange={(e) => onField('author', e.target.value)}
              />
            </div>
            <div className="pte-field">
              <label htmlFor={fieldId('subject')}>
                {t.pdfTitleEditor.subject}
                {marker('subject')}
              </label>
              <input
                id={fieldId('subject')}
                type="text"
                value={metadata.subject}
                maxLength={LIMITS.maxTextLength}
                disabled={!editable}
                onChange={(e) => onField('subject', e.target.value)}
              />
            </div>
            <div className="pte-field">
              <label htmlFor={fieldId('keywords')}>
                {t.pdfTitleEditor.keywords}
                {marker('keywords')}
              </label>
              <input
                id={fieldId('keywords')}
                type="text"
                defaultValue={formatKeywords(metadata.keywords)}
                key={formatKeywords(metadata.keywords)}
                disabled={!editable}
                placeholder={t.pdfTitleEditor.keywordsPlaceholder}
                onBlur={(e) => onField('keywords', e.target.value)}
              />
              <p className="pte-hint">{t.pdfTitleEditor.keywordsHint}</p>
            </div>
          </details>
        </>
      )}

      <div className="pte-card-actions">
        {isEditable(item) && showCreate && (
          <button
            type="button"
            className="pte-btn pte-btn-small"
            onClick={onCreate}
            disabled={!editable}
          >
            {t.pdfTitleEditor.createThisOne}
          </button>
        )}
        {isEditable(item) && (
          <button
            type="button"
            className="pte-linkbtn"
            onClick={onReset}
            disabled={!editable}
          >
            {t.pdfTitleEditor.resetOne}
          </button>
        )}
        <button
          type="button"
          className="pte-linkbtn pte-remove"
          onClick={onRemove}
          disabled={disabled}
        >
          {t.pdfTitleEditor.removeOne}
        </button>
      </div>
    </li>
  );
}
