import { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLocale } from '~/i18n/locale';
import type { RenderedPage } from '~/lib/pdf/render';
import type { PageItem } from '../lib/types';

export type Thumbnail = RenderedPage | 'failed' | undefined;

export function PageCard({
  item,
  position,
  thumbnail,
  selected,
  startsFile,
  showCut,
  isFirst,
  isLast,
  disabled,
  onVisible,
  onSelect,
  onToggleCut,
  onMove,
  onRotate,
  onDelete,
}: {
  item: PageItem;
  position: number;
  thumbnail: Thumbnail;
  selected: boolean;
  // Marked as the first page of a new file, in the cut-where-you-click mode.
  startsFile: boolean;
  showCut: boolean;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onVisible: (sourceIndex: number, visible: boolean) => void;
  onSelect: (extend: boolean) => void;
  onToggleCut: () => void;
  onMove: (delta: number) => void;
  onRotate: (delta: number) => void;
  onDelete: () => void;
}) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });
  const frameRef = useRef<HTMLDivElement>(null);

  // Only what is on screen is drawn. A three-hundred-page document would
  // otherwise spend its first minute rendering thumbnails nobody has scrolled
  // to yet, and hold all of them in memory afterwards.
  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      // Without the observer — jsdom, and very old browsers — every page is
      // treated as visible, which is the behaviour that is merely slow rather
      // than the one that shows nothing.
      onVisible(item.sourceIndex, true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          onVisible(item.sourceIndex, entry.isIntersecting);
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      onVisible(item.sourceIndex, false);
    };
  }, [item.sourceIndex, onVisible]);

  // The thumbnail comes out of pdf.js with the page's own rotation already
  // applied, so the preview only has to turn by what the user added.
  const turn = (item.rotation - item.baseRotation + 360) % 360;
  const quarter = turn === 90 || turn === 270;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        'ppo-card',
        selected ? 'ppo-selected' : '',
        startsFile && showCut ? 'ppo-cut' : '',
        isDragging ? 'ppo-dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="ppo-card-top">
        <button
          type="button"
          className="ppo-handle"
          aria-label={t.pdfPageOrganizer.dragHandle}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <span className="ppo-position">{position}</span>
        <span className="ppo-source">
          {t.pdfPageOrganizer.sourcePage(item.sourceIndex + 1)}
        </span>
      </div>

      <button
        type="button"
        className="ppo-thumb"
        aria-pressed={selected}
        aria-label={t.pdfPageOrganizer.selectPage(position)}
        disabled={disabled}
        data-page-card="true"
        onClick={(event) => onSelect(event.shiftKey)}
      >
        <div className="ppo-frame" ref={frameRef}>
          {thumbnail && thumbnail !== 'failed' && (
            <img
              src={thumbnail.url}
              alt=""
              className={quarter ? 'ppo-image ppo-image-quarter' : 'ppo-image'}
              style={{ transform: `rotate(${turn}deg)` }}
            />
          )}
          {thumbnail === 'failed' && (
            <span className="ppo-thumb-failed">
              {t.pdfPageOrganizer.errors.render_failed}
            </span>
          )}
          {!thumbnail && <span className="ppo-thumb-loading" aria-hidden />}
        </div>
      </button>

      <div className="ppo-card-actions">
        <button
          type="button"
          className="ppo-iconbtn"
          aria-label={t.pdfPageOrganizer.moveBack}
          disabled={disabled || isFirst}
          onClick={() => onMove(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="ppo-iconbtn"
          aria-label={t.pdfPageOrganizer.rotateLeft}
          disabled={disabled}
          onClick={() => onRotate(-90)}
        >
          ↺
        </button>
        <button
          type="button"
          className="ppo-iconbtn"
          aria-label={t.pdfPageOrganizer.rotateRight}
          disabled={disabled}
          onClick={() => onRotate(90)}
        >
          ↻
        </button>
        <button
          type="button"
          className="ppo-iconbtn ppo-danger"
          aria-label={t.pdfPageOrganizer.deletePage}
          disabled={disabled}
          onClick={onDelete}
        >
          ✕
        </button>
        <button
          type="button"
          className="ppo-iconbtn"
          aria-label={t.pdfPageOrganizer.moveForward}
          disabled={disabled || isLast}
          onClick={() => onMove(1)}
        >
          ›
        </button>
      </div>

      {showCut && !isFirst && (
        <button
          type="button"
          className="ppo-cutbtn"
          aria-pressed={startsFile}
          disabled={disabled}
          onClick={onToggleCut}
        >
          {startsFile
            ? t.pdfPageOrganizer.cutHere
            : t.pdfPageOrganizer.cutBefore}
        </button>
      )}
    </li>
  );
}
