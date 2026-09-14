import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { formatBytes } from '~/lib/format';
import { resolveOutputName } from '~/lib/pdf/filename';
import { createRenderer, type PdfRenderer } from '~/lib/pdf/render';
import { classifyFiles } from '~/lib/pdf/validate';
import { createPdfZip } from '~/lib/pdf/zip';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import { Dropzone } from './components/Dropzone';
import { PageCard, type Thumbnail } from './components/PageCard';
import { splitZipName } from './lib/filename';
import {
  canRedo,
  canUndo,
  initHistory,
  pushHistory,
  redo,
  undo,
  type History,
} from './lib/history';
import { OrganizeError, buildOutputs, inspectPdf } from './lib/organize';
import {
  createPages,
  deletePages,
  keepOnly,
  movePage,
  reversePages,
  rotatePages,
} from './lib/pages';
import {
  boundariesToSegments,
  describeSegments,
  everyNSegments,
  segmentsFromSelection,
} from './lib/split';
import {
  DEFAULT_SPLIT_SIZE,
  type OrganizeErrorCode,
  type OrganizeWarning,
  type OutputMode,
  type PageItem,
  type RejectedFile,
  type SplitMode,
} from './lib/types';
import './pdf-page-organizer.css';

// Tagged on every analytics event so GA4 can segment by tool.
const TOOL = 'pdf-page-organizer' as const;

// The thumbnail's drawing width. A little wider than the widest column the
// grid produces, so a card scales the raster down rather than up; drawing at
// roughly display size, times the device pixel ratio, is what keeps a long
// document inside the tab's memory.
const THUMB_WIDTH = 220;
// Two at a time: enough to keep the grid filling while scrolling, few enough
// that the main thread still answers a click.
const CONCURRENCY = 2;
// Thumbnails held at once. Past this the oldest off-screen ones are dropped and
// redrawn if the user scrolls back, which costs a moment instead of the tab.
const MAX_THUMBS = 120;

type Source = {
  name: string;
  size: number;
  // The bytes pdf-lib writes from. pdf.js gets a copy of this and detaches it,
  // so the two halves of the tool must never share one buffer.
  bytes: Uint8Array;
  pageCount: number;
  warnings: OrganizeWarning[];
};

function toErrorCode(error: unknown): OrganizeErrorCode {
  return error instanceof OrganizeError ? error.code : 'organize_failed';
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function PdfPageOrganizerTool() {
  const { t } = useLocale();
  const [source, setSource] = useState<Source>();
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [history, setHistory] = useState<History<PageItem[]>>(() =>
    initHistory<PageItem[]>([]),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cuts, setCuts] = useState<Set<string>>(new Set());
  const [outputMode, setOutputMode] = useState<OutputMode>('single');
  const [splitMode, setSplitMode] = useState<SplitMode>('boundaries');
  const [splitSize, setSplitSize] = useState(String(DEFAULT_SPLIT_SIZE));
  const [outputName, setOutputName] = useState('');
  const [thumbs, setThumbs] = useState<Map<number, Thumbnail>>(new Map());
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>();
  const [result, setResult] = useState<{ files: number; pages: number }>();
  const [error, setError] = useState<OrganizeErrorCode | null>(null);

  const rendererRef = useRef<PdfRenderer>(null);
  const thumbsRef = useRef(new Map<number, Thumbnail>());
  const queueRef = useRef<number[]>([]);
  const visibleRef = useRef(new Set<number>());
  const drawingRef = useRef(new Map<number, AbortController>());
  const activeRef = useRef(0);
  const anchorRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLUListElement>(null);

  const pages = history.present;
  const busy = reading || progress !== undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const storeThumbnail = useCallback((index: number, value: Thumbnail) => {
    const map = thumbsRef.current;
    map.set(index, value);
    // Insertion order, oldest first, skipping anything on screen.
    for (const key of map.keys()) {
      if (map.size <= MAX_THUMBS) {
        break;
      }
      if (!visibleRef.current.has(key)) {
        map.delete(key);
      }
    }
    setThumbs(new Map(map));
  }, []);

  const pump = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }
    while (activeRef.current < CONCURRENCY) {
      const index = queueRef.current.shift();
      if (index === undefined) {
        return;
      }
      // Scrolled past while it waited, or already drawn: nothing to do.
      if (!visibleRef.current.has(index) || thumbsRef.current.has(index)) {
        continue;
      }
      const controller = new AbortController();
      drawingRef.current.set(index, controller);
      activeRef.current += 1;
      renderer
        .renderPage(index, THUMB_WIDTH, controller.signal)
        .then((page) => storeThumbnail(index, page))
        .catch(() => {
          // A page that will not draw is still a page that can be moved,
          // deleted and written out, so the card falls back to its number
          // rather than the document being refused.
          if (!controller.signal.aborted) {
            storeThumbnail(index, 'failed');
          }
        })
        .finally(() => {
          drawingRef.current.delete(index);
          activeRef.current -= 1;
          pump();
        });
    }
  }, [storeThumbnail]);

  const handleVisible = useCallback(
    (index: number, visible: boolean) => {
      if (visible) {
        visibleRef.current.add(index);
        if (
          !thumbsRef.current.has(index) &&
          !queueRef.current.includes(index)
        ) {
          queueRef.current.push(index);
          pump();
        }
        return;
      }
      visibleRef.current.delete(index);
      drawingRef.current.get(index)?.abort();
    },
    [pump],
  );

  const reset = useCallback(() => {
    rendererRef.current?.destroy();
    rendererRef.current = null;
    thumbsRef.current = new Map();
    queueRef.current = [];
    visibleRef.current = new Set();
    for (const controller of drawingRef.current.values()) {
      controller.abort();
    }
    drawingRef.current = new Map();
    activeRef.current = 0;
    anchorRef.current = null;
    setThumbs(new Map());
    setSelected(new Set());
    setCuts(new Set());
    setResult(undefined);
    setError(null);
  }, []);

  // The renderer holds a pdf.js worker, which outlives the page unless it is
  // told not to.
  useEffect(() => () => rendererRef.current?.destroy(), []);

  const openFile = async (file: File) => {
    if (source && !window.confirm(t.pdfPageOrganizer.replaceConfirm)) {
      return;
    }
    const classified = classifyFiles([file], { count: 0, bytes: 0 }, () =>
      crypto.randomUUID(),
    );
    if (classified.accepted.length === 0) {
      setRejected(classified.rejected);
      return;
    }

    reset();
    setRejected([]);
    setSource(undefined);
    setHistory(initHistory<PageItem[]>([]));
    setReading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const inspection = await inspectPdf(bytes);
      const renderer = await createRenderer(bytes);
      rendererRef.current = renderer;
      setSource({
        name: file.name,
        size: file.size,
        bytes,
        pageCount: inspection.pageCount,
        warnings: inspection.warnings,
      });
      setHistory(
        initHistory(
          createPages(inspection.rotations, () => crypto.randomUUID()),
        ),
      );
      setOutputName(file.name);
      track('files_added', { tool: TOOL, file_count: inspection.pageCount });
    } catch (failure) {
      setError(toErrorCode(failure));
    } finally {
      setReading(false);
    }
  };

  // Every edit goes through here: one place to record history and to drop the
  // selections and cuts that referred to pages which no longer exist.
  const applyPages = (next: PageItem[]) => {
    const ids = new Set(next.map((page) => page.id));
    setHistory((current) => pushHistory(current, next));
    setSelected((current) => new Set([...current].filter((id) => ids.has(id))));
    setCuts((current) => new Set([...current].filter((id) => ids.has(id))));
    setResult(undefined);
  };

  const stepHistory = (next: History<PageItem[]>) => {
    const ids = new Set(next.present.map((page) => page.id));
    setHistory(next);
    setSelected((current) => new Set([...current].filter((id) => ids.has(id))));
    setCuts((current) => new Set([...current].filter((id) => ids.has(id))));
    setResult(undefined);
  };

  const selectPage = (index: number, extend: boolean) => {
    const page = pages[index];
    if (!page) {
      return;
    }
    const anchor = anchorRef.current;
    setSelected((current) => {
      const next = new Set(current);
      if (extend && anchor !== null && anchor < pages.length) {
        const from = Math.min(anchor, index);
        const to = Math.max(anchor, index);
        for (let i = from; i <= to; i += 1) {
          next.add(pages[i]!.id);
        }
        return next;
      }
      if (next.has(page.id)) {
        next.delete(page.id);
      } else {
        next.add(page.id);
      }
      return next;
    });
    anchorRef.current = index;
  };

  const selectedIds = useMemo(
    () => pages.filter((page) => selected.has(page.id)).map((page) => page.id),
    [pages, selected],
  );

  const rotateSelection = (delta: number) => {
    const ids = selectedIds.length > 0 ? selectedIds : pages.map((p) => p.id);
    applyPages(rotatePages(pages, ids, delta));
    track('batch_action', {
      tool: TOOL,
      action: 'rotate',
      file_count: ids.length,
    });
  };

  const deleteSelection = () => {
    if (selectedIds.length === 0) {
      return;
    }
    applyPages(deletePages(pages, selectedIds));
    track('batch_action', {
      tool: TOOL,
      action: 'delete',
      file_count: selectedIds.length,
    });
  };

  const keepSelection = () => {
    if (selectedIds.length === 0) {
      return;
    }
    applyPages(keepOnly(pages, selectedIds));
    track('batch_action', {
      tool: TOOL,
      action: 'keep-only',
      file_count: selectedIds.length,
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }
    const from = pages.findIndex((page) => page.id === active.id);
    const to = pages.findIndex((page) => page.id === over.id);
    if (from >= 0 && to >= 0) {
      applyPages(arrayMove(pages, from, to));
      track('batch_action', { tool: TOOL, action: 'reorder', file_count: 1 });
    }
  };

  // Left and right walk the grid; up and down move a row, worked out from where
  // the cards actually sit so it follows however many columns fit.
  const handleGridKeys = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const keys = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];
    if (!keys.includes(event.key)) {
      return;
    }
    const cards = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>(
        '[data-page-card="true"]',
      ) ?? [],
    );
    const current = cards.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) {
      return;
    }
    const first = cards[0];
    const columns = first
      ? Math.max(
          cards.filter((card) => card.offsetTop === first.offsetTop).length,
          1,
        )
      : 1;
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns,
      ArrowDown: columns,
    };
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? cards.length - 1
          : current + (moves[event.key] ?? 0);
    const next = cards[Math.min(Math.max(target, 0), cards.length - 1)];
    if (next) {
      event.preventDefault();
      next.focus();
    }
  };

  const segments = useMemo(() => {
    if (outputMode === 'single') {
      return boundariesToSegments(pages.length, []);
    }
    if (splitMode === 'every-n') {
      return everyNSegments(pages.length, Number(splitSize));
    }
    return segmentsFromSelection(
      pages,
      splitMode === 'selection' ? selected : cuts,
    );
  }, [cuts, outputMode, pages, selected, splitMode, splitSize]);

  const splitProblem: OrganizeErrorCode | null =
    outputMode === 'split' && pages.length > 0
      ? segments.length === 0
        ? 'split_invalid'
        : segments.length === 1
          ? 'split_no_boundary'
          : null
      : null;

  const canDownload =
    !busy && pages.length > 0 && splitProblem === null && source !== undefined;

  const run = async () => {
    if (!source || !canDownload) {
      return;
    }
    const name = resolveOutputName(outputName, source.name);
    setError(null);
    setResult(undefined);
    setProgress({ done: 0, total: segments.length });
    try {
      const entries = await buildOutputs(source.bytes, pages, segments, {
        outputName: name,
        onProgress: setProgress,
      });
      const single = entries[0];
      if (entries.length === 1 && single) {
        downloadBlob(single.blob, single.name);
      } else {
        downloadBlob(await createPdfZip(entries), splitZipName(name));
      }
      setResult({ files: entries.length, pages: pages.length });
      // Counts and one of two fixed values. Nothing about the document itself:
      // not its name, not a page's contents, not what the user typed.
      track('download_completed', {
        tool: TOOL,
        file_count: pages.length,
        mode: outputMode,
      });
    } catch (failure) {
      setError(toErrorCode(failure));
    } finally {
      setProgress(undefined);
    }
  };

  const hasFile = source !== undefined;
  const allSelected = pages.length > 0 && selected.size === pages.length;

  return (
    <main className="ppo-root">
      <ToolIntro
        heading={t.pdfPageOrganizerPage.heading}
        lead={t.pdfPageOrganizerPage.lead}
        privacyNote={t.pdfPageOrganizerPage.privacyNote}
      />

      <section className="ppo-section" aria-labelledby="ppo-add-heading">
        <h2 id="ppo-add-heading">{t.pdfPageOrganizer.addHeading}</h2>
        <Dropzone onFile={(file) => void openFile(file)} compact={hasFile} />
        {!hasFile && (
          <p className="ppo-hint">{t.pdfPageOrganizer.supportedFormats}</p>
        )}
        {reading && (
          <p className="ppo-progress" role="status">
            {t.pdfPageOrganizer.reading}
          </p>
        )}
        {source && (
          <p className="ppo-summary">
            <span className="ppo-filename">{source.name}</span>
            {' — '}
            {t.pdfPageOrganizer.fileSummary(
              source.pageCount,
              formatBytes(source.size),
            )}
          </p>
        )}
        {source?.warnings.map((warning) => (
          <p key={warning} className="ppo-warning">
            {t.pdfPageOrganizer.warnings[warning]}
          </p>
        ))}
      </section>

      {rejected.length > 0 && (
        <section className="ppo-rejected" aria-live="polite">
          <h2>{t.pdfPageOrganizer.rejectedHeading}</h2>
          <ul>
            {rejected.map((file) => (
              <li key={file.id}>
                <span className="ppo-filename">{file.name}</span>{' '}
                <span>{t.pdfPageOrganizer.errors[file.errorCode]}</span>
                <button
                  type="button"
                  className="ppo-linkbtn"
                  onClick={() =>
                    setRejected((current) =>
                      current.filter((entry) => entry.id !== file.id),
                    )
                  }
                >
                  {t.pdfPageOrganizer.dismiss}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hasFile && error && (
        <p className="ppo-error" role="alert">
          {t.pdfPageOrganizer.errors[error]}
        </p>
      )}

      {hasFile && (
        <section className="ppo-section" aria-labelledby="ppo-edit-heading">
          <h2 id="ppo-edit-heading">{t.pdfPageOrganizer.editHeading}</h2>

          <div className="ppo-toolbar">
            <div className="ppo-actions">
              <button
                type="button"
                className="ppo-btn ppo-btn-secondary ppo-btn-small"
                disabled={busy || pages.length === 0}
                onClick={() =>
                  setSelected(
                    allSelected
                      ? new Set()
                      : new Set(pages.map((page) => page.id)),
                  )
                }
              >
                {allSelected
                  ? t.pdfPageOrganizer.clearSelection
                  : t.pdfPageOrganizer.selectAll}
              </button>
              <button
                type="button"
                className="ppo-btn ppo-btn-secondary ppo-btn-small"
                disabled={busy || pages.length === 0}
                onClick={() =>
                  setSelected(
                    new Set(
                      pages
                        .filter((page) => !selected.has(page.id))
                        .map((page) => page.id),
                    ),
                  )
                }
              >
                {t.pdfPageOrganizer.invertSelection}
              </button>
              <span className="ppo-count" role="status">
                {t.pdfPageOrganizer.selectedCount(selected.size)}
              </span>
            </div>

            <div className="ppo-actions">
              <button
                type="button"
                className="ppo-btn ppo-btn-secondary ppo-btn-small"
                disabled={busy || pages.length === 0}
                onClick={() => rotateSelection(-90)}
              >
                {t.pdfPageOrganizer.rotateLeftAll}
              </button>
              <button
                type="button"
                className="ppo-btn ppo-btn-secondary ppo-btn-small"
                disabled={busy || pages.length === 0}
                onClick={() => rotateSelection(90)}
              >
                {t.pdfPageOrganizer.rotateRightAll}
              </button>
              <button
                type="button"
                className="ppo-btn ppo-btn-secondary ppo-btn-small"
                disabled={busy || selected.size === 0}
                onClick={deleteSelection}
              >
                {t.pdfPageOrganizer.deleteSelected}
              </button>
              <button
                type="button"
                className="ppo-btn ppo-btn-secondary ppo-btn-small"
                disabled={busy || selected.size === 0}
                onClick={keepSelection}
              >
                {t.pdfPageOrganizer.keepSelected}
              </button>
              <button
                type="button"
                className="ppo-btn ppo-btn-secondary ppo-btn-small"
                disabled={busy || pages.length < 2}
                onClick={() => applyPages(reversePages(pages))}
              >
                {t.pdfPageOrganizer.reverse}
              </button>
            </div>

            <div className="ppo-actions">
              <button
                type="button"
                className="ppo-btn ppo-btn-secondary ppo-btn-small"
                disabled={busy || !canUndo(history)}
                onClick={() => stepHistory(undo(history))}
              >
                {t.pdfPageOrganizer.undo}
              </button>
              <button
                type="button"
                className="ppo-btn ppo-btn-secondary ppo-btn-small"
                disabled={busy || !canRedo(history)}
                onClick={() => stepHistory(redo(history))}
              >
                {t.pdfPageOrganizer.redo}
              </button>
            </div>
          </div>

          <p className="ppo-hint">{t.pdfPageOrganizer.selectHint}</p>

          {pages.length === 0 ? (
            <p className="ppo-empty" role="status">
              {t.pdfPageOrganizer.noPagesLeft}
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pages.map((page) => page.id)}
                strategy={rectSortingStrategy}
              >
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <ul
                  className="ppo-grid"
                  ref={gridRef}
                  onKeyDown={handleGridKeys}
                >
                  {pages.map((page, index) => (
                    <PageCard
                      key={page.id}
                      item={page}
                      position={index + 1}
                      thumbnail={thumbs.get(page.sourceIndex)}
                      selected={selected.has(page.id)}
                      startsFile={cuts.has(page.id)}
                      showCut={
                        outputMode === 'split' && splitMode === 'boundaries'
                      }
                      isFirst={index === 0}
                      isLast={index === pages.length - 1}
                      disabled={busy}
                      onVisible={handleVisible}
                      onSelect={(extend) => selectPage(index, extend)}
                      onToggleCut={() =>
                        setCuts((current) => {
                          const next = new Set(current);
                          if (next.has(page.id)) {
                            next.delete(page.id);
                          } else {
                            next.add(page.id);
                          }
                          return next;
                        })
                      }
                      onMove={(delta) =>
                        applyPages(movePage(pages, index, index + delta))
                      }
                      onRotate={(delta) =>
                        applyPages(rotatePages(pages, [page.id], delta))
                      }
                      onDelete={() => applyPages(deletePages(pages, [page.id]))}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </section>
      )}

      {hasFile && (
        <section className="ppo-run" aria-labelledby="ppo-run-heading">
          <h2 id="ppo-run-heading">{t.pdfPageOrganizer.runHeading}</h2>

          <fieldset className="ppo-fieldset">
            <legend>{t.pdfPageOrganizer.outputModeLegend}</legend>
            <label className="ppo-radio">
              <input
                type="radio"
                name="ppo-output-mode"
                value="single"
                checked={outputMode === 'single'}
                disabled={busy}
                onChange={() => setOutputMode('single')}
              />
              <span>{t.pdfPageOrganizer.singleMode}</span>
            </label>
            <label className="ppo-radio">
              <input
                type="radio"
                name="ppo-output-mode"
                value="split"
                checked={outputMode === 'split'}
                disabled={busy}
                onChange={() => setOutputMode('split')}
              />
              <span>{t.pdfPageOrganizer.splitMode}</span>
            </label>
          </fieldset>

          {outputMode === 'split' && (
            <div className="ppo-split">
              <div className="ppo-field">
                <label htmlFor="ppo-split-mode">
                  {t.pdfPageOrganizer.splitModeLabel}
                </label>
                <select
                  id="ppo-split-mode"
                  value={splitMode}
                  disabled={busy}
                  onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                >
                  <option value="boundaries">
                    {t.pdfPageOrganizer.splitByCuts}
                  </option>
                  <option value="every-n">
                    {t.pdfPageOrganizer.splitEveryN}
                  </option>
                  <option value="selection">
                    {t.pdfPageOrganizer.splitBySelection}
                  </option>
                </select>
              </div>

              {splitMode === 'every-n' && (
                <div className="ppo-field ppo-field-number">
                  <label htmlFor="ppo-split-size">
                    {t.pdfPageOrganizer.splitSizeLabel}
                  </label>
                  <input
                    id="ppo-split-size"
                    type="number"
                    min={1}
                    max={pages.length || 1}
                    value={splitSize}
                    disabled={busy}
                    onChange={(e) => setSplitSize(e.target.value)}
                  />
                </div>
              )}

              <p className="ppo-hint">
                {splitMode === 'boundaries' && t.pdfPageOrganizer.cutsHint}
                {splitMode === 'selection' && t.pdfPageOrganizer.selectionHint}
                {splitMode === 'every-n' && t.pdfPageOrganizer.everyNHint}
              </p>
            </div>
          )}

          <div className="ppo-field ppo-field-name">
            <label htmlFor="ppo-output-name">
              {t.pdfPageOrganizer.outputNameLabel}
            </label>
            <input
              id="ppo-output-name"
              type="text"
              value={outputName}
              disabled={busy}
              onChange={(e) => setOutputName(e.target.value)}
            />
          </div>

          <p className="ppo-outcome">
            {outputMode === 'single'
              ? t.pdfPageOrganizer.outcomeSingle(
                  source?.pageCount ?? 0,
                  pages.length,
                )
              : splitProblem === null
                ? t.pdfPageOrganizer.outcomeSplit(
                    segments.length,
                    describeSegments(segments),
                  )
                : t.pdfPageOrganizer.errors[splitProblem]}
          </p>

          <button
            type="button"
            className="ppo-btn ppo-btn-primary"
            onClick={() => void run()}
            disabled={!canDownload}
          >
            {outputMode === 'single'
              ? t.pdfPageOrganizer.download
              : t.pdfPageOrganizer.downloadZip}
          </button>

          <p className="ppo-progress" role="status">
            {progress &&
              t.pdfPageOrganizer.working(progress.done, progress.total)}
            {!busy &&
              result &&
              t.pdfPageOrganizer.done(result.files, result.pages)}
          </p>

          {error && (
            <p className="ppo-error" role="alert">
              {t.pdfPageOrganizer.errors[error]}
            </p>
          )}
        </section>
      )}

      <ToolGuide guide={t.pdfPageOrganizerGuide} current="pdf-page-organizer" />
    </main>
  );
}

export default PdfPageOrganizerTool;
