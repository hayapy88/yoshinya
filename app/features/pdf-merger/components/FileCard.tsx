import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLocale } from '~/i18n/locale';
import { formatBytes } from '~/lib/format';
import { parsePageRange } from '../lib/page-range';
import type { MergeItem } from '../lib/types';

type Props = {
  item: MergeItem;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onPageRange: (value: string) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
};

export function FileCard({
  item,
  position,
  isFirst,
  isLast,
  disabled,
  onPageRange,
  onMove,
  onRemove,
}: Props) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  // Resolving here rather than in state keeps the input showing exactly what
  // was typed while still reporting what it currently means.
  const range =
    item.pageCount === undefined
      ? null
      : parsePageRange(item.pageRange, item.pageCount);
  const rangeError = range && !range.ok ? range.error : null;

  return (
    <li
      ref={setNodeRef}
      className={`pdm-card${isDragging ? ' pdm-dragging' : ''}${
        item.status === 'error' ? ' pdm-card-failed' : ''
      }`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
    >
      <div className="pdm-card-head">
        {/* Only the handle starts a drag: the card holds a text field, and a
            whole-card listener would swallow the pointer before it lands. */}
        <button
          type="button"
          className="pdm-handle"
          aria-label={t.pdfMerger.dragHandle}
          {...listeners}
        >
          ⠿
        </button>
        <span className="pdm-position">{position}</span>
        <div className="pdm-card-id">
          <p className="pdm-filename">{item.fileName}</p>
          <p className="pdm-meta">
            {item.status === 'loading'
              ? t.pdfMerger.reading
              : item.pageCount !== undefined &&
                t.pdfMerger.pageCount(item.pageCount)}
            {item.pageCount !== undefined && ' · '}
            {formatBytes(item.size)}
          </p>
        </div>
        <div className="pdm-card-move">
          <button
            type="button"
            className="pdm-iconbtn"
            aria-label={t.pdfMerger.moveUp}
            disabled={disabled || isFirst}
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="pdm-iconbtn"
            aria-label={t.pdfMerger.moveDown}
            disabled={disabled || isLast}
            onClick={() => onMove(1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="pdm-iconbtn pdm-remove"
            aria-label={t.pdfMerger.remove}
            disabled={disabled}
            onClick={onRemove}
          >
            ✕
          </button>
        </div>
      </div>

      {item.status === 'error' && item.errorCode && (
        <p className="pdm-card-error" role="alert">
          {t.pdfMerger.errors[item.errorCode]}
        </p>
      )}

      {item.warnings.map((warning) => (
        <p key={warning} className="pdm-card-warning">
          {t.pdfMerger.warnings[warning]}
        </p>
      ))}

      {item.status === 'ready' && (
        <div className="pdm-field">
          <label htmlFor={`pdm-range-${item.id}`}>
            {t.pdfMerger.pageRangeLabel}
          </label>
          <input
            id={`pdm-range-${item.id}`}
            type="text"
            inputMode="text"
            value={item.pageRange}
            placeholder={t.pdfMerger.pageRangePlaceholder}
            disabled={disabled}
            aria-invalid={rangeError !== null}
            aria-describedby={`pdm-range-note-${item.id}`}
            onChange={(e) => onPageRange(e.target.value)}
          />
          <p
            id={`pdm-range-note-${item.id}`}
            className={rangeError ? 'pdm-range-error' : 'pdm-range-note'}
          >
            {rangeError
              ? t.pdfMerger.errors[rangeError]
              : item.pageRange.trim() === ''
                ? t.pdfMerger.usingAll
                : t.pdfMerger.usingSome(range?.ok ? range.pages.length : 0)}
          </p>
          <p className="pdm-range-hint">{t.pdfMerger.pageRangeHint}</p>
        </div>
      )}
    </li>
  );
}
