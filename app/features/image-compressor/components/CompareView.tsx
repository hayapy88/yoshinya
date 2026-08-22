import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';

type Point = { x: number; y: number };

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;

/**
 * Before and after in the same place, revealed by a draggable divider.
 *
 * Both images occupy the identical box and receive the identical transform, so
 * a pixel under the divider is the same pixel on both sides — which is the
 * whole point. Comparing two images side by side at different offsets tells
 * you nothing about compression artefacts.
 */
export function CompareView({
  beforeUrl,
  afterUrl,
  alt,
  isBusy,
  isFullscreen = false,
  onToggleFullscreen,
  onToggleSettings,
  isSettingsOpen = false,
}: {
  beforeUrl: string;
  afterUrl: string | null;
  alt: string;
  isBusy: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  /** Only supplied in full screen; the row hides it above the narrow layout. */
  onToggleSettings?: () => void;
  isSettingsOpen?: boolean;
}) {
  const { t } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const [divider, setDivider] = useState(50);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  // Space held down shows the original full-frame, for a quick sanity check.
  const [peeking, setPeeking] = useState(false);

  const fit = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // A new image starts fitted rather than inheriting the previous zoom, which
  // would drop the user into an arbitrary corner of a differently sized photo.
  useEffect(() => {
    fit();
    setDivider(50);
  }, [beforeUrl, fit]);

  const zoomBy = useCallback((factor: number) => {
    setScale((current) =>
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, current * factor)),
    );
  }, []);

  // Dragging: the divider when grabbing the handle, otherwise panning.
  const dragState = useRef<{
    mode: 'divider' | 'pan';
    start: Point;
    origin: Point;
  } | null>(null);

  const moveDivider = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setDivider(Math.min(100, Math.max(0, ratio)));
  };

  const onPointerDown = (event: React.PointerEvent) => {
    const target = event.target as HTMLElement;
    const mode = target.dataset.role === 'divider' ? 'divider' : 'pan';
    dragState.current = {
      mode,
      start: { x: event.clientX, y: event.clientY },
      origin: offset,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    if (mode === 'divider') {
      moveDivider(event.clientX);
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag) {
      return;
    }
    if (drag.mode === 'divider') {
      moveDivider(event.clientX);
      return;
    }
    setOffset({
      x: drag.origin.x + (event.clientX - drag.start.x),
      y: drag.origin.y + (event.clientY - drag.start.y),
    });
  };

  const endDrag = (event: React.PointerEvent) => {
    dragState.current = null;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(
      event.pointerId,
    );
  };

  // Global shortcuts, suppressed while a form control has focus so typing a
  // width or dragging the quality slider never moves the picture instead.
  useEffect(() => {
    const isTyping = () => {
      const active = document.activeElement;
      if (!active) {
        return false;
      }
      return (
        active instanceof HTMLInputElement ||
        active instanceof HTMLSelectElement ||
        active instanceof HTMLTextAreaElement ||
        (active as HTMLElement).isContentEditable
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping()) {
        return;
      }
      if (event.key === ' ' && !event.repeat) {
        event.preventDefault();
        setPeeking(true);
        return;
      }
      if (event.key === '+' || event.key === '=') {
        zoomBy(1.25);
      } else if (event.key === '-') {
        zoomBy(0.8);
      } else if (event.key === '0') {
        fit();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        setPeeking(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [fit, zoomBy]);

  const transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
  const reveal = peeking ? 100 : divider;

  return (
    <div className="ic-compare">
      <div
        ref={stageRef}
        className={`ic-stage${scale > 1 ? ' ic-zoomed' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={(event) => {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomBy(event.deltaY < 0 ? 1.1 : 0.9);
          }
        }}
      >
        <div className="ic-layer" style={{ transform }}>
          <img src={beforeUrl} alt={alt} draggable={false} />
        </div>
        {afterUrl && (
          // The clip sits on an untransformed wrapper, not on the layer itself.
          // clip-path resolves in the element's own coordinate space, so
          // clipping the transformed layer makes the boundary zoom and pan with
          // the image while the divider stays put — the two drift apart the
          // moment you zoom. Clipping the outer box keeps the boundary in stage
          // coordinates, where the divider also lives.
          <div
            className="ic-clip"
            style={{ clipPath: `inset(0 0 0 ${reveal}%)` }}
          >
            <div className="ic-layer" style={{ transform }}>
              <img src={afterUrl} alt="" draggable={false} />
            </div>
          </div>
        )}

        {/* Labelled in words, not by colour alone. */}
        <span className="ic-side ic-side-left">
          {t.imageCompressor.beforeLabel}
        </span>
        <span className="ic-side ic-side-right">
          {t.imageCompressor.afterLabel}
        </span>

        {afterUrl && !peeking && (
          <div
            className="ic-divider"
            data-role="divider"
            style={{ left: `${divider}%` }}
            role="slider"
            tabIndex={0}
            aria-label={t.imageCompressor.dividerLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(divider)}
            aria-valuetext={t.imageCompressor.dividerValue(Math.round(divider))}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                event.stopPropagation();
                setDivider((v) => Math.max(0, v - (event.shiftKey ? 10 : 2)));
              } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                event.stopPropagation();
                setDivider((v) => Math.min(100, v + (event.shiftKey ? 10 : 2)));
              }
            }}
          >
            <span
              className="ic-divider-grip"
              data-role="divider"
              aria-hidden="true"
            />
          </div>
        )}

        {isBusy && (
          <p className="ic-stage-busy" role="status">
            {t.imageCompressor.processing}
          </p>
        )}
      </div>

      <div className="ic-zoom">
        {/* The stepper reads as one control: the two buttons belong to the
            number between them, not to the buttons beside it. */}
        <div className="ic-zoom-steps">
          <button
            type="button"
            className="ic-zoom-step"
            onClick={() => zoomBy(0.8)}
            aria-label={t.imageCompressor.zoomOut}
          >
            −
          </button>
          <span className="ic-zoom-value">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="ic-zoom-step"
            onClick={() => zoomBy(1.25)}
            aria-label={t.imageCompressor.zoomIn}
          >
            ＋
          </button>
        </div>
        {/* Both of these are the same kind of thing — a view command — so they
            get the same shape rather than one being an underlined link. */}
        <button
          type="button"
          className="ic-btn ic-btn-secondary ic-btn-small"
          onClick={fit}
        >
          {t.imageCompressor.zoomFit}
        </button>
        {/* Narrow screens only, by stylesheet: where the settings float beside
            the picture there is nothing to reveal. */}
        {onToggleSettings && (
          <button
            type="button"
            className="ic-btn ic-btn-secondary ic-btn-small ic-fs-settings"
            aria-expanded={isSettingsOpen}
            onClick={onToggleSettings}
          >
            {/* Always the reveal label. The open sheet covers this row and
                carries its own way out, so relabelling it would only put a
                second unreachable "close" on the page under the same name. */}
            {t.imageCompressor.showSettings}
          </button>
        )}
        {onToggleFullscreen && (
          <button
            type="button"
            className="ic-btn ic-btn-secondary ic-btn-small"
            onClick={onToggleFullscreen}
          >
            {isFullscreen
              ? t.imageCompressor.exitFullscreen
              : t.imageCompressor.enterFullscreen}
          </button>
        )}
        <span className="ic-hint">
          {isFullscreen
            ? t.imageCompressor.fullscreenHint
            : t.imageCompressor.compareHint}
        </span>
      </div>
    </div>
  );
}
