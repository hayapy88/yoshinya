import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import {
  MAX_POINTS,
  MODES,
  detectBackground,
  removeBackground,
  toHex,
  type Pixels,
  type Point,
  type RemoveSettings,
} from './lib/remove';
import {
  DEFAULT_SETTINGS,
  TOLERANCE_MAX,
  TOLERANCE_MIN,
  isDefault,
  readSettings,
  writeSettings,
} from './lib/settings';
import {
  ACCEPT,
  classifyFiles,
  outputFileName,
  resolveDuplicateNames,
  zipFileName,
  type Rejected,
} from './lib/files';
import { TooManyPixelsError, decodeImage, encodePng } from './lib/image';
import './background-remover.css';

const TOOL = 'background-remover' as const;

// Sliders emit continuously; only the value the user stops on is worth a
// full pass over a large image.
const PREVIEW_DEBOUNCE_MS = 120;

type ItemError = 'too_many_pixels' | 'decode_failed';

type Item = {
  id: string;
  file: File;
  thumbUrl: string;
  points: Point[];
  error: ItemError | null;
};

type Decoded = { id: string; pixels: Pixels };

const BACKDROPS = ['checker', 'white', 'black'] as const;
type Backdrop = (typeof BACKDROPS)[number];

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function decode(file: File): Promise<Pixels | ItemError> {
  try {
    return await decodeImage(file);
  } catch (error) {
    return error instanceof TooManyPixelsError
      ? 'too_many_pixels'
      : 'decode_failed';
  }
}

async function process(
  pixels: Pixels,
  settings: RemoveSettings,
  points: Point[],
): Promise<Blob> {
  const { color } = detectBackground(pixels, settings.tolerance);
  const { data } = removeBackground(pixels, settings, color, points);
  return encodePng(data, pixels.width, pixels.height);
}

function Dropzone({
  onFiles,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const s = t.backgroundRemover;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const handle = (list: FileList | null) => {
    if (list && list.length > 0) {
      onFiles(Array.from(list));
    }
  };
  return (
    <div
      className={`br-dropzone${isOver ? ' br-over' : ''}${compact ? ' br-compact' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        handle(event.dataTransfer.files);
      }}
    >
      <span className="br-dropzone-label">
        {compact ? s.addMore : s.dropzone}
      </span>
      {!compact && <span className="br-hint">{s.supportedFormats}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        data-testid="br-file-input"
        onChange={(event) => {
          handle(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}

export default function BackgroundRemoverTool() {
  const { t, locale } = useLocale();
  const s = t.backgroundRemover;
  const percent = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'percent' }),
    [locale],
  );

  const [items, setItems] = useState<Item[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [rejected, setRejected] = useState<Rejected[]>([]);
  const [settings, setSettings] = useState<RemoveSettings>(DEFAULT_SETTINGS);
  const [restored, setRestored] = useState(false);
  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [removedShare, setRemovedShare] = useState<number | null>(null);
  const [backdrop, setBackdrop] = useState<Backdrop>('checker');
  const [showOriginal, setShowOriginal] = useState(false);
  const [zipProgress, setZipProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnRef = useRef<Pixels | null>(null);
  const toleranceId = useId();
  const modeName = useId();

  const current = items.find((item) => item.id === currentId) ?? null;
  const pixels = decoded && decoded.id === currentId ? decoded.pixels : null;
  const detection = useMemo(
    () => (pixels ? detectBackground(pixels, settings.tolerance) : null),
    [pixels, settings.tolerance],
  );

  // Read after mount: the server has no localStorage, and reading during
  // render would make the first paint differ from the HTML being hydrated.
  useEffect(() => {
    const stored = readSettings();
    setSettings(stored.settings);
    setRestored(stored.restored);
  }, []);

  // Object URLs pin the file in memory until revoked.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(
    () => () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.thumbUrl);
      }
    },
    [],
  );

  // Only the image on screen is held decoded; the rest stay as files until
  // they are shown or saved, which keeps a 200-image batch affordable.
  // Keyed on the file, not the item: clicks replace the item object, and
  // re-decoding on every click would be waste.
  const currentFile = current?.file;
  const currentFailed = Boolean(current?.error);
  useEffect(() => {
    if (!currentId || !currentFile || currentFailed) {
      return;
    }
    let active = true;
    void decode(currentFile).then((result) => {
      if (!active) {
        return;
      }
      if (typeof result === 'string') {
        setItems((list) =>
          list.map((item) =>
            item.id === currentId ? { ...item, error: result } : item,
          ),
        );
        return;
      }
      setDecoded({ id: currentId, pixels: result });
    });
    return () => {
      active = false;
    };
  }, [currentId, currentFile, currentFailed]);

  const points = current?.points;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pixels || !canvas) {
      return;
    }
    const timer = window.setTimeout(
      () => {
        const context = canvas.getContext('2d');
        if (!context) {
          return;
        }
        canvas.width = pixels.width;
        canvas.height = pixels.height;
        if (showOriginal) {
          context.putImageData(
            new ImageData(pixels.data, pixels.width, pixels.height),
            0,
            0,
          );
          return;
        }
        const result = removeBackground(
          pixels,
          settings,
          detection?.color ?? null,
          points,
        );
        context.putImageData(
          new ImageData(result.data, pixels.width, pixels.height),
          0,
          0,
        );
        setRemovedShare(result.removed);
        drawnRef.current = pixels;
      },
      // The first draw of a new image should not wait.
      drawnRef.current === pixels ? PREVIEW_DEBOUNCE_MS : 0,
    );
    return () => window.clearTimeout(timer);
  }, [pixels, settings, detection?.color, points, showOriginal]);

  const updateSettings = (patch: Partial<RemoveSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      writeSettings(next);
      return next;
    });
  };

  const select = (id: string) => {
    if (id !== currentId) {
      setCurrentId(id);
      setRemovedShare(null);
      setShowOriginal(false);
    }
  };

  const addFiles = (files: File[]) => {
    const { accepted, rejected: refused } = classifyFiles(files, {
      count: items.length,
      bytes: items.reduce((sum, item) => sum + item.file.size, 0),
    });
    setRejected(refused);
    setNotice(null);
    if (accepted.length === 0) {
      return;
    }
    const added: Item[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      thumbUrl: URL.createObjectURL(file),
      points: [],
      error: null,
    }));
    setItems((list) => [...list, ...added]);
    if (!current) {
      select(added[0]!.id);
    }
    track('files_added', { tool: TOOL, file_count: added.length });
  };

  const removeItem = (id: string) => {
    const index = items.findIndex((item) => item.id === id);
    const item = items[index];
    if (!item) {
      return;
    }
    URL.revokeObjectURL(item.thumbUrl);
    const rest = items.filter((other) => other.id !== id);
    setItems(rest);
    if (id === currentId) {
      const next = rest[Math.min(index, rest.length - 1)];
      setCurrentId(next?.id ?? null);
      setRemovedShare(null);
      setShowOriginal(false);
    }
  };

  const removeAll = () => {
    if (!window.confirm(s.removeAllConfirm)) {
      return;
    }
    for (const item of items) {
      URL.revokeObjectURL(item.thumbUrl);
    }
    setItems([]);
    setCurrentId(null);
    setDecoded(null);
    setRemovedShare(null);
    setRejected([]);
    setNotice(null);
  };

  const setPoints = (update: (points: Point[]) => Point[], action: string) => {
    if (!current) {
      return;
    }
    setItems((list) =>
      list.map((item) =>
        item.id === current.id
          ? { ...item, points: update(item.points) }
          : item,
      ),
    );
    setShowOriginal(false);
    track('batch_action', { tool: TOOL, action });
  };

  const onPreviewClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pixels || !current || current.points.length >= MAX_POINTS) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const x = Math.floor(
      ((event.clientX - rect.left) / rect.width) * pixels.width,
    );
    const y = Math.floor(
      ((event.clientY - rect.top) / rect.height) * pixels.height,
    );
    setPoints((list) => [...list, { x, y }], 'add_point');
  };

  const saveCurrent = async () => {
    if (!current || !pixels) {
      return;
    }
    const blob = await process(pixels, settings, current.points);
    download(blob, outputFileName(current.file.name));
    track('download_completed', { tool: TOOL, file_count: 1 });
  };

  // One image at a time — decode, clear, encode — so only one image's pixels
  // are ever held while a large batch is saved.
  const saveZip = async () => {
    if (zipProgress || items.length === 0) {
      return;
    }
    setNotice(null);
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const names = resolveDuplicateNames(
      items.map((item) => outputFileName(item.file.name)),
    );
    let saved = 0;
    let skipped = 0;
    setZipProgress({ done: 0, total: items.length });
    try {
      for (const [index, item] of items.entries()) {
        const source =
          item.id === decoded?.id ? decoded.pixels : await decode(item.file);
        if (typeof source === 'string') {
          skipped += 1;
        } else {
          zip.file(names[index]!, await process(source, settings, item.points));
          saved += 1;
        }
        setZipProgress({ done: index + 1, total: items.length });
      }
      if (saved > 0) {
        // Store, not deflate: PNG is already compressed.
        download(
          await zip.generateAsync({ type: 'blob', compression: 'STORE' }),
          zipFileName(),
        );
        track('download_completed', { tool: TOOL, file_count: saved });
      }
      if (skipped > 0) {
        setNotice(s.zipSkipped(skipped));
      }
    } catch {
      setNotice(s.zipFailed);
    } finally {
      setZipProgress(null);
    }
  };

  const busy = Boolean(current && !current.error && !pixels);

  return (
    <main className="br-page">
      <ToolIntro
        heading={t.backgroundRemoverPage.heading}
        lead={t.backgroundRemoverPage.lead}
        privacyNote={t.backgroundRemoverPage.privacyNote}
      />

      <section className="br-section" aria-labelledby="br-add-heading">
        <div className="br-section-head">
          <h2 id="br-add-heading">{s.addHeading}</h2>
          {items.length > 0 && (
            <div className="br-row">
              <Dropzone onFiles={addFiles} compact />
              <button
                type="button"
                className="br-btn br-btn-secondary"
                onClick={removeAll}
              >
                {s.removeAll}
              </button>
            </div>
          )}
        </div>
        {items.length === 0 && <Dropzone onFiles={addFiles} />}

        {rejected.length > 0 && (
          <div className="br-rejected" aria-live="polite">
            <p className="br-rejected-title">{s.rejectedHeading}</p>
            <ul>
              {rejected.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <span className="br-name">{file.name}</span>{' '}
                  {s.errors[file.code]}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="br-btn br-btn-secondary"
              onClick={() => setRejected([])}
            >
              {s.dismiss}
            </button>
          </div>
        )}
      </section>

      <section className="br-section" aria-labelledby="br-settings-heading">
        <div className="br-section-head">
          <h2 id="br-settings-heading">{s.settingsHeading}</h2>
          <button
            type="button"
            className="br-btn br-btn-secondary"
            disabled={isDefault(settings)}
            onClick={() => updateSettings(DEFAULT_SETTINGS)}
          >
            {s.resetSettings}
          </button>
        </div>
        {restored && <p className="br-hint">{s.restored}</p>}

        <div className="br-settings">
          <fieldset className="br-card">
            <legend className="br-card-legend">{s.modeLabel}</legend>
            <div className="br-modes">
              {MODES.map((mode) => (
                <label key={mode} className="br-mode">
                  <input
                    type="radio"
                    name={modeName}
                    value={mode}
                    checked={settings.mode === mode}
                    onChange={() => updateSettings({ mode })}
                  />
                  <span>
                    <strong>{s.modes[mode]}</strong>
                    <small>{s.modeHints[mode]}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="br-card">
            <label htmlFor={toleranceId} className="br-card-legend">
              {s.toleranceLabel}{' '}
              <output htmlFor={toleranceId} className="br-value">
                {settings.tolerance}%
              </output>
            </label>
            <input
              id={toleranceId}
              type="range"
              className="br-range"
              min={TOLERANCE_MIN}
              max={TOLERANCE_MAX}
              step={1}
              value={settings.tolerance}
              onChange={(event) =>
                updateSettings({ tolerance: Number(event.target.value) })
              }
            />
            <p className="br-hint">{s.toleranceHint}</p>

            <label className="br-check">
              <input
                type="checkbox"
                checked={settings.smoothEdges}
                onChange={(event) =>
                  updateSettings({ smoothEdges: event.target.checked })
                }
              />
              <span>{s.smoothEdges}</span>
            </label>
            <p className="br-hint">{s.smoothEdgesHint}</p>
          </div>
        </div>
      </section>

      <section className="br-section" aria-labelledby="br-result-heading">
        <div className="br-section-head">
          <h2 id="br-result-heading">{s.resultHeading}</h2>
          {items.length > 0 && (
            <div className="br-row">
              <button
                type="button"
                className="br-btn br-btn-primary"
                disabled={!pixels || Boolean(zipProgress)}
                onClick={() => void saveCurrent()}
              >
                {s.download}
              </button>
              <button
                type="button"
                className="br-btn br-btn-outline"
                disabled={Boolean(zipProgress)}
                onClick={() => void saveZip()}
              >
                {zipProgress
                  ? s.zipping(zipProgress.done, zipProgress.total)
                  : s.downloadZip}
              </button>
            </div>
          )}
        </div>
        {notice && (
          <p className="br-notice" role="status">
            {notice}
          </p>
        )}

        {items.length === 0 ? (
          <div className="br-empty br-checker" aria-hidden="true" />
        ) : (
          <div className="br-workspace">
            <div className="br-viewer">
              <div className="br-toolbar">
                <div
                  className="br-backdrops"
                  role="group"
                  aria-label={s.backdropLabel}
                >
                  {BACKDROPS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="br-pill"
                      aria-pressed={backdrop === value}
                      onClick={() => setBackdrop(value)}
                    >
                      {s.backdrops[value]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="br-pill"
                  aria-pressed={showOriginal}
                  disabled={!pixels}
                  onClick={() => setShowOriginal((value) => !value)}
                >
                  {s.showOriginal}
                </button>
              </div>

              <div className={`br-stage br-${backdrop}`}>
                {current?.error ? (
                  <p className="br-error" role="alert">
                    {s.errors[current.error]}
                  </p>
                ) : (
                  <>
                    <canvas
                      ref={canvasRef}
                      className="br-canvas"
                      hidden={!pixels}
                      aria-label={s.previewLabel}
                      onClick={onPreviewClick}
                    />
                    {busy && <p className="br-hint">{s.processing}</p>}
                  </>
                )}
              </div>

              {pixels && (
                <div className="br-facts" aria-live="polite">
                  {detection?.color ? (
                    <span className="br-fact">
                      {s.detected}{' '}
                      <span
                        className="br-swatch"
                        style={{ background: toHex(detection.color) }}
                      />
                      <code>{toHex(detection.color)}</code>
                    </span>
                  ) : (
                    <span className="br-fact">{s.detectedNone}</span>
                  )}
                  <span className="br-fact">
                    {s.pixelSize(pixels.width, pixels.height)}
                  </span>
                  {removedShare !== null && !showOriginal && (
                    <span className="br-fact">
                      {s.removedShare(percent.format(removedShare))}
                    </span>
                  )}
                </div>
              )}
              {detection?.color && detection.coverage < 0.5 && (
                <p className="br-warn">{s.lowCoverage}</p>
              )}

              <p className="br-hint">{s.clickHint}</p>
              {current && current.points.length > 0 && (
                <div className="br-row">
                  <span className="br-points">
                    {s.points(current.points.length)}
                  </span>
                  <button
                    type="button"
                    className="br-btn br-btn-secondary"
                    onClick={() =>
                      setPoints((list) => list.slice(0, -1), 'undo_point')
                    }
                  >
                    {s.undoPoint}
                  </button>
                  <button
                    type="button"
                    className="br-btn br-btn-secondary"
                    onClick={() => setPoints(() => [], 'clear_points')}
                  >
                    {s.clearPoints}
                  </button>
                </div>
              )}
            </div>

            <div className="br-list">
              <p className="br-list-head">
                {s.imagesLabel}{' '}
                <span className="br-muted">{s.imageCount(items.length)}</span>
              </p>
              <ul aria-label={s.imagesLabel}>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`br-thumb${item.id === currentId ? ' br-thumb-current' : ''}`}
                  >
                    <button
                      type="button"
                      className="br-thumb-select"
                      aria-label={s.select(item.file.name)}
                      aria-current={item.id === currentId ? 'true' : undefined}
                      onClick={() => select(item.id)}
                    >
                      <img src={item.thumbUrl} alt="" />
                      <span className="br-name">{item.file.name}</span>
                    </button>
                    <button
                      type="button"
                      className="br-thumb-remove"
                      aria-label={s.remove(item.file.name)}
                      onClick={() => removeItem(item.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <ToolGuide guide={t.backgroundRemoverGuide} current={TOOL} />
    </main>
  );
}
