import { useState } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { classifyFiles } from '~/lib/pdf/validate';
import { resolveOutputName } from '~/lib/pdf/filename';
import type { RejectedFile } from '~/lib/pdf/types';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import { Dropzone } from './components/Dropzone';
import { FileCard } from './components/FileCard';
import {
  MergeError,
  inspectPdf,
  mergePdfs,
  totalOutputPages,
} from './lib/merge';
import { moveItem, reverse, sortByName } from './lib/order';
import { parsePageRange } from './lib/page-range';
import {
  DEFAULT_OUTPUT_NAME,
  type MergeErrorCode,
  type MergeItem,
} from './lib/types';
import './pdf-merger.css';

// Tagged on every analytics event so GA4 can segment by tool.
const TOOL = 'pdf-merger' as const;

function toErrorCode(error: unknown): MergeErrorCode {
  return error instanceof MergeError ? error.code : 'corrupted';
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function PdfMergerTool() {
  const { t } = useLocale();
  const [items, setItems] = useState<MergeItem[]>([]);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [outputName, setOutputName] = useState(DEFAULT_OUTPUT_NAME);
  const [progress, setProgress] = useState<{ done: number; total: number }>();
  const [result, setResult] = useState<{ files: number; pages: number }>();
  const [mergeError, setMergeError] = useState<MergeErrorCode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const isMerging = progress !== undefined;
  const isLoading = items.some((item) => item.status === 'loading');
  const busy = isMerging || isLoading;

  const patch = (id: string, changes: Partial<MergeItem>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );

  const addFiles = (files: File[]) => {
    const totals = items.reduce(
      (acc, item) => ({ count: acc.count + 1, bytes: acc.bytes + item.size }),
      { count: 0, bytes: 0 },
    );
    const classified = classifyFiles(files, totals, () => crypto.randomUUID());
    const added: MergeItem[] = classified.accepted.map((file) => ({
      id: crypto.randomUUID(),
      sourceFile: file,
      fileName: file.name,
      size: file.size,
      pageRange: '',
      warnings: [],
      status: 'loading',
    }));

    setItems((current) => [...current, ...added]);
    setRejected((current) => [...current, ...classified.rejected]);
    setResult(undefined);
    if (added.length > 0) {
      track('files_added', { tool: TOOL, file_count: added.length });
    }

    // Inspected one at a time: a hundred simultaneous arrayBuffer() calls would
    // spike memory for no gain.
    void (async () => {
      for (const item of added) {
        try {
          const { pageCount, warnings } = await inspectPdf(item.sourceFile);
          patch(item.id, { pageCount, warnings, status: 'ready' });
        } catch (error) {
          patch(item.id, {
            status: 'error',
            errorCode: toErrorCode(error),
          });
        }
      }
    })();
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }
    setItems((current) => {
      const from = current.findIndex((item) => item.id === active.id);
      const to = current.findIndex((item) => item.id === over.id);
      return from >= 0 && to >= 0 ? arrayMove(current, from, to) : current;
    });
  };

  const removeAll = () => {
    if (items.length > 0 && !window.confirm(t.pdfMerger.removeAllConfirm)) {
      return;
    }
    setItems([]);
    setResult(undefined);
  };

  // Ready, parsed, and with a page range that resolves: the same rule the merge
  // itself applies, so the button and the outcome cannot disagree.
  const mergeable = items.filter(
    (item) =>
      item.status === 'ready' &&
      item.pageCount !== undefined &&
      parsePageRange(item.pageRange, item.pageCount).ok,
  );
  const outputPages = totalOutputPages(items);
  const totalPages = items.reduce(
    (sum, item) => sum + (item.pageCount ?? 0),
    0,
  );

  const merge = async () => {
    if (mergeable.length === 0) {
      return;
    }
    const name = resolveOutputName(outputName, DEFAULT_OUTPUT_NAME);
    setMergeError(null);
    setResult(undefined);
    setProgress({ done: 0, total: mergeable.length });
    try {
      const blob = await mergePdfs(items, {
        outputName: name,
        onProgress: setProgress,
      });
      downloadBlob(blob, name);
      setResult({ files: mergeable.length, pages: outputPages });
      // mode records only whether page ranges were used at all, as one of two
      // fixed values — never which pages, which is something the user typed.
      track('download_completed', {
        tool: TOOL,
        file_count: mergeable.length,
        mode: mergeable.some((item) => item.pageRange.trim() !== '')
          ? 'pages'
          : 'all',
      });
    } catch (error) {
      setMergeError(toErrorCode(error));
    } finally {
      setProgress(undefined);
    }
  };

  const hasFiles = items.length > 0;

  return (
    <main className="pdm-root">
      <ToolIntro
        heading={t.pdfMergerPage.heading}
        lead={t.pdfMergerPage.lead}
        privacyNote={t.pdfMergerPage.privacyNote}
      />

      <section className="pdm-section" aria-labelledby="pdm-add-heading">
        <h2 id="pdm-add-heading">{t.pdfMerger.addHeading}</h2>
        <Dropzone onFiles={addFiles} compact={hasFiles} />
        {!hasFiles && (
          <p className="pdm-hint">{t.pdfMerger.supportedFormats}</p>
        )}
      </section>

      {rejected.length > 0 && (
        <section className="pdm-rejected" aria-live="polite">
          <h2>{t.pdfMerger.rejectedHeading}</h2>
          <ul>
            {rejected.map((file) => (
              <li key={file.id}>
                <span className="pdm-filename">{file.name}</span>{' '}
                <span>{t.pdfMerger.errors[file.errorCode]}</span>
                <button
                  type="button"
                  className="pdm-linkbtn"
                  onClick={() =>
                    setRejected((current) =>
                      current.filter((entry) => entry.id !== file.id),
                    )
                  }
                >
                  {t.pdfMerger.dismiss}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasFiles && (
        <section className="pdm-section" aria-labelledby="pdm-order-heading">
          <h2 id="pdm-order-heading">{t.pdfMerger.orderHeading}</h2>
          <p className="pdm-summary">
            {t.pdfMerger.summary(items.length, totalPages)}
          </p>
          <div className="pdm-actions">
            <button
              type="button"
              className="pdm-btn pdm-btn-secondary pdm-btn-small"
              disabled={busy || items.length < 2}
              onClick={() => setItems((current) => sortByName(current))}
            >
              {t.pdfMerger.sortByName}
            </button>
            <button
              type="button"
              className="pdm-btn pdm-btn-secondary pdm-btn-small"
              disabled={busy || items.length < 2}
              onClick={() => setItems((current) => reverse(current))}
            >
              {t.pdfMerger.reverse}
            </button>
            <button
              type="button"
              className="pdm-linkbtn pdm-remove"
              disabled={busy}
              onClick={removeAll}
            >
              {t.pdfMerger.removeAll}
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="pdm-cards">
                {items.map((item, index) => (
                  <FileCard
                    key={item.id}
                    item={item}
                    position={index + 1}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    disabled={busy}
                    onPageRange={(value) =>
                      patch(item.id, { pageRange: value })
                    }
                    onMove={(delta) =>
                      setItems((current) =>
                        moveItem(current, index, index + delta),
                      )
                    }
                    onRemove={() =>
                      setItems((current) =>
                        current.filter((entry) => entry.id !== item.id),
                      )
                    }
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {hasFiles && (
        <section className="pdm-run" aria-labelledby="pdm-run-heading">
          <h2 id="pdm-run-heading">{t.pdfMerger.runHeading}</h2>

          <div className="pdm-field pdm-field-name">
            <label htmlFor="pdm-output-name">
              {t.pdfMerger.outputNameLabel}
            </label>
            <input
              id="pdm-output-name"
              type="text"
              value={outputName}
              disabled={busy}
              onChange={(e) => setOutputName(e.target.value)}
            />
          </div>

          <p className="pdm-outcome">{t.pdfMerger.outputPages(outputPages)}</p>

          <button
            type="button"
            className="pdm-btn pdm-btn-primary"
            onClick={() => void merge()}
            disabled={busy || mergeable.length === 0}
          >
            {t.pdfMerger.merge}
          </button>

          <p className="pdm-progress" role="status">
            {isLoading && t.pdfMerger.reading}
            {progress && t.pdfMerger.merging(progress.done, progress.total)}
            {!busy && result && t.pdfMerger.merged(result.files, result.pages)}
            {!busy && !result && mergeable.length === 0 && (
              <span className="pdm-muted">{t.pdfMerger.needTwo}</span>
            )}
          </p>

          {mergeError && (
            <p className="pdm-card-error" role="alert">
              {t.pdfMerger.errors[mergeError]}
            </p>
          )}
        </section>
      )}

      <ToolGuide guide={t.pdfMergerGuide} current="pdf-merger" />
    </main>
  );
}

export default PdfMergerTool;
