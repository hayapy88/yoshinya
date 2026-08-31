import { useEffect, useId, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import { ICON_CATEGORIES, ICONS, type IconDefinition } from './lib/icon-data';
import { buildSvg } from './lib/svg';
import { normalizeHex } from './lib/color';
import { filterIcons, type CategoryFilter, type IconLabel } from './lib/search';
import {
  ZIP_FILE_NAME,
  plannedFileCount,
  pngFileName,
  svgFileName,
  zipEntryPath,
} from './lib/files';
import { saveBlob, svgBlob, svgToPngBlob } from './lib/png';
import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  parseSettings,
  serializeSettings,
} from './lib/settings';
import {
  BACKGROUND_SHAPES,
  COLOR_PRESETS,
  PADDING_MAX,
  PADDING_MIN,
  PNG_SIZES,
  SIZE_MAX,
  SIZE_MIN,
  STROKE_MAX,
  STROKE_MIN,
  STROKE_STEP,
  type ExportSettings,
  type IconStyle,
} from './lib/style';
import './icon-generator.css';

const TOOL = 'icon-generator' as const;
const LUCIDE_URL = 'https://lucide.dev';

// The grid draws every icon at one modest size regardless of the export size,
// so choosing 512 px does not turn the page into a column of billboards.
const GRID_ICON_PX = 40;
// The preview shows the real size up to this, then the stylesheet takes over.
const PREVIEW_MAX_PX = 176;

/**
 * A colour input with a picker, a hex field and the presets.
 *
 * The text field keeps its own draft, because committing on every keystroke
 * would make the colour vanish the moment someone types `#1` on the way to
 * `#162e64`. Only a value that parses is handed upwards.
 */
function ColorField({
  label,
  pickerLabel,
  value,
  invalidMessage,
  onChange,
}: {
  label: string;
  // The swatch needs a name of its own: sharing one with the hex field would
  // have a screen reader announce the same control twice.
  pickerLabel: string;
  value: string;
  invalidMessage: string;
  onChange: (color: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [touched, setTouched] = useState(false);
  const fieldId = useId();

  // Follows changes made elsewhere — a preset, or the picker.
  useEffect(() => {
    setDraft(value);
    setTouched(false);
  }, [value]);

  const invalid = touched && normalizeHex(draft) === null;

  return (
    <div className="ig-field">
      {/* The visible label names the hex field rather than the swatch: the
          field is the one that needs saying out loud, since the swatch already
          shows what it is. */}
      <label className="ig-field-label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="ig-color-row">
        <input
          type="color"
          className="ig-color-picker"
          value={value}
          aria-label={pickerLabel}
          onChange={(event) =>
            onChange(normalizeHex(event.target.value) ?? value)
          }
        />
        <input
          id={fieldId}
          type="text"
          className="ig-color-text"
          value={draft}
          spellCheck={false}
          aria-invalid={invalid}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            setTouched(true);
            const parsed = normalizeHex(next);
            if (parsed) {
              onChange(parsed);
            }
          }}
        />
      </div>
      <ul className="ig-swatches">
        {COLOR_PRESETS.map((preset) => (
          <li key={preset}>
            <button
              type="button"
              className={`ig-swatch${preset === value ? ' ig-swatch-on' : ''}`}
              style={{ background: preset }}
              aria-label={preset}
              aria-pressed={preset === value}
              onClick={() => onChange(preset)}
            />
          </li>
        ))}
      </ul>
      {invalid && <p className="ig-error">{invalidMessage}</p>}
    </div>
  );
}

function IconGeneratorTool() {
  const { t } = useLocale();
  // The dictionary types this as an object with one key per icon; the grid looks
  // labels up by an icon id it only knows as a string.
  const labels = t.iconLabels as Record<string, IconLabel>;

  const [style, setStyle] = useState<IconStyle>(DEFAULT_SETTINGS.style);
  const [exports, setExports] = useState<ExportSettings>(
    DEFAULT_SETTINGS.exports,
  );
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Nothing is written back to storage until the saved settings have been read,
  // or the first render would overwrite them with the defaults.
  const loaded = useRef(false);

  useEffect(() => {
    track('tool_opened', { tool: TOOL });
    try {
      const saved = parseSettings(localStorage.getItem(STORAGE_KEY));
      setStyle(saved.style);
      setExports(saved.exports);
    } catch {
      // Storage can be unavailable or blocked; the defaults are already set.
    }
    loaded.current = true;
    return () => {
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!loaded.current) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, serializeSettings({ style, exports }));
    } catch {
      // A full or disabled store only costs the user the memory of it.
    }
  }, [style, exports]);

  const visible = useMemo(
    () => filterIcons(ICONS, query, category, labels),
    [query, category, labels],
  );

  // One SVG per icon at the grid size. Rebuilt when the look changes, not when
  // the export size does — the grid is a swatch, not a preview of the file.
  const gridSvgs = useMemo(() => {
    const gridStyle = { ...style, size: GRID_ICON_PX };
    return new Map(ICONS.map((icon) => [icon.id, buildSvg(icon, gridStyle)]));
  }, [style]);

  const previewIcon =
    ICONS.find((icon) => selected.has(icon.id)) ?? visible[0] ?? ICONS[0];
  const previewSvg = buildSvg(previewIcon, {
    ...style,
    size: Math.min(style.size, PREVIEW_MAX_PX),
  });

  const selectedIcons = ICONS.filter((icon) => selected.has(icon.id));
  const fileCount = plannedFileCount(selectedIcons.length, exports);

  const setStylePart = (part: Partial<IconStyle>) => {
    setStyle((current) => ({ ...current, ...part }));
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const togglePngSize = (size: number) => {
    setExports((current) => {
      const has = current.pngSizes.includes(size);
      const next = has
        ? current.pngSizes.filter((value) => value !== size)
        : [...current.pngSizes, size].sort((a, b) => a - b);
      // Leaving PNG on with no sizes would make the button promise files it
      // cannot write, so the last one stays ticked.
      return next.length === 0 ? current : { ...current, pngSizes: next };
    });
  };

  const copySvg = async (icon: IconDefinition) => {
    setError(null);
    try {
      await navigator.clipboard.writeText(buildSvg(icon, style));
      setCopiedId(icon.id);
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = setTimeout(() => setCopiedId(null), 2000);
      track('batch_action', { tool: TOOL, action: 'copy_svg', file_count: 1 });
    } catch {
      setError(t.iconGenerator.copyFailed);
    }
  };

  const downloadSvg = (icon: IconDefinition) => {
    setError(null);
    saveBlob(svgBlob(buildSvg(icon, style)), svgFileName(icon.id));
    track('batch_action', { tool: TOOL, action: 'download_svg', file_count: 1 });
  };

  const downloadPng = async (icon: IconDefinition) => {
    setError(null);
    try {
      const blob = await svgToPngBlob(buildSvg(icon, style), style.size);
      saveBlob(blob, pngFileName(icon.id, style.size));
      track('batch_action', {
        tool: TOOL,
        action: 'download_png',
        file_count: 1,
      });
    } catch {
      setError(t.iconGenerator.pngFailed);
    }
  };

  const downloadZip = async () => {
    setError(null);
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const icon of selectedIcons) {
        if (exports.svg) {
          const name = svgFileName(icon.id);
          zip.file(zipEntryPath(name), buildSvg(icon, style));
        }
        if (exports.png) {
          for (const size of exports.pngSizes) {
            const blob = await svgToPngBlob(
              buildSvg(icon, { ...style, size }),
              size,
            );
            const name = pngFileName(icon.id, size);
            zip.file(zipEntryPath(name, size), blob);
          }
        }
      }
      saveBlob(await zip.generateAsync({ type: 'blob' }), ZIP_FILE_NAME);
      // The count, never which icons: an icon id is a fixed value but the set
      // someone picked is closer to what they are working on than we need.
      track('download_completed', { tool: TOOL, file_count: fileCount });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(t.iconGenerator.zipFailed(message));
    } finally {
      setZipping(false);
    }
  };

  const hasBackground = style.background !== 'none';

  return (
    <main className="ig-page">
      <ToolIntro
        heading={t.iconGeneratorPage.heading}
        lead={t.iconGeneratorPage.lead}
        privacyNote={t.iconGeneratorPage.privacyNote}
      />

      <section className="ig-section">
        <h2>{t.iconGenerator.styleHeading}</h2>
        <div className="ig-style">
          <div className="ig-preview">
            <span className="ig-preview-label">
              {t.iconGenerator.previewLabel}
            </span>
            {/* The preview is the export: the same builder, the same settings,
                only the size attribute differs. The markup it contains is a
                build-time artifact and the colours are normalized before they
                reach it, so nothing user-supplied is being parsed here. */}
            <span
              className="ig-preview-icon"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          </div>

          <div className="ig-controls">
            <ColorField
              label={t.iconGenerator.color}
              pickerLabel={t.iconGenerator.colorPicker(t.iconGenerator.color)}
              value={style.color}
              invalidMessage={t.iconGenerator.colorInvalid}
              onChange={(color) => setStylePart({ color })}
            />

            <div className="ig-field">
              <label className="ig-field-label" htmlFor="ig-stroke">
                {t.iconGenerator.strokeWidth}
                <output htmlFor="ig-stroke">{style.strokeWidth}</output>
              </label>
              <input
                id="ig-stroke"
                type="range"
                min={STROKE_MIN}
                max={STROKE_MAX}
                step={STROKE_STEP}
                value={style.strokeWidth}
                onChange={(event) =>
                  setStylePart({ strokeWidth: Number(event.target.value) })
                }
              />
              <p className="ig-hint">{t.iconGenerator.strokeWidthHint}</p>
            </div>

            <div className="ig-field">
              <label className="ig-field-label" htmlFor="ig-size">
                {t.iconGenerator.size}
                <output htmlFor="ig-size">{style.size} px</output>
              </label>
              <input
                id="ig-size"
                type="number"
                min={SIZE_MIN}
                max={SIZE_MAX}
                value={style.size}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next)) {
                    setStylePart({ size: next });
                  }
                }}
                onBlur={(event) => {
                  // Clamped on blur rather than on change, so typing 5 on the
                  // way to 512 does not jump the field to the minimum.
                  const next = Number(event.target.value);
                  setStylePart({
                    size: Number.isFinite(next)
                      ? Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(next)))
                      : SIZE_MIN,
                  });
                }}
              />
            </div>

            <div className="ig-field">
              <span className="ig-field-label">
                {t.iconGenerator.background}
              </span>
              <div className="ig-choices">
                {BACKGROUND_SHAPES.map((shape) => (
                  <label key={shape} className="ig-choice">
                    <input
                      type="radio"
                      name="ig-background"
                      checked={style.background === shape}
                      onChange={() => setStylePart({ background: shape })}
                    />
                    {t.iconGenerator.backgrounds[shape]}
                  </label>
                ))}
              </div>
            </div>

            {/* Both only mean anything behind a background, so they appear
                with one rather than sitting there doing nothing. */}
            {hasBackground && (
              <>
                <ColorField
                  label={t.iconGenerator.backgroundColor}
                  pickerLabel={t.iconGenerator.colorPicker(
                    t.iconGenerator.backgroundColor,
                  )}
                  value={style.backgroundColor}
                  invalidMessage={t.iconGenerator.colorInvalid}
                  onChange={(backgroundColor) =>
                    setStylePart({ backgroundColor })
                  }
                />
                <div className="ig-field">
                  <label className="ig-field-label" htmlFor="ig-padding">
                    {t.iconGenerator.padding}
                    <output htmlFor="ig-padding">{style.padding}</output>
                  </label>
                  <input
                    id="ig-padding"
                    type="range"
                    min={PADDING_MIN}
                    max={PADDING_MAX}
                    step={1}
                    value={style.padding}
                    onChange={(event) =>
                      setStylePart({ padding: Number(event.target.value) })
                    }
                  />
                </div>
              </>
            )}

            <button
              type="button"
              className="ig-linkbtn"
              onClick={() => setStyle(DEFAULT_SETTINGS.style)}
            >
              {t.iconGenerator.resetStyle}
            </button>
          </div>
        </div>
      </section>

      <section className="ig-section">
        <h2>{t.iconGenerator.pickHeading}</h2>

        <div className="ig-filters">
          <div className="ig-field ig-search">
            <label className="ig-field-label" htmlFor="ig-search">
              {t.iconGenerator.searchLabel}
            </label>
            <input
              id="ig-search"
              type="search"
              value={query}
              placeholder={t.iconGenerator.searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="ig-choices ig-categories">
            {(['all', ...ICON_CATEGORIES] as CategoryFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`ig-tab${category === value ? ' ig-tab-on' : ''}`}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {t.iconGenerator.categories[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="ig-list-head">
          <span className="ig-count">
            <span>{t.iconGenerator.resultCount(visible.length)}</span>
            {selected.size > 0 && (
              <span>{t.iconGenerator.selectedCount(selected.size)}</span>
            )}
          </span>
          <div className="ig-head-actions">
            <button
              type="button"
              className="ig-btn ig-btn-secondary"
              onClick={() =>
                setSelected(
                  // Selects what is on screen: after a search, "all" meaning
                  // all 128 rather than the eleven shown would be a surprise.
                  new Set([
                    ...selected,
                    ...visible.map((icon) => icon.id),
                  ]),
                )
              }
            >
              {t.iconGenerator.selectAll}
            </button>
            <button
              type="button"
              className="ig-btn ig-btn-secondary"
              disabled={selected.size === 0}
              onClick={() => setSelected(new Set())}
            >
              {t.iconGenerator.clearSelection}
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="ig-empty">
            {t.iconGenerator.noResults}{' '}
            <button
              type="button"
              className="ig-linkbtn"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
            >
              {t.iconGenerator.clearSearch}
            </button>
          </p>
        ) : (
          <ul className="ig-grid">
            {visible.map((icon) => {
              const label = labels[icon.id];
              const isSelected = selected.has(icon.id);
              return (
                <li
                  key={icon.id}
                  className={`ig-card${isSelected ? ' ig-card-on' : ''}`}
                >
                  <label className="ig-card-main">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(icon.id)}
                      aria-label={t.iconGenerator.selectIcon(
                        label?.name ?? icon.id,
                      )}
                    />
                    <span
                      className="ig-icon"
                      dangerouslySetInnerHTML={{
                        __html: gridSvgs.get(icon.id) ?? '',
                      }}
                    />
                    <span className="ig-card-name">
                      {label?.name ?? icon.id}
                    </span>
                  </label>
                  <div className="ig-card-actions">
                    <button
                      type="button"
                      className="ig-chip"
                      onClick={() => void copySvg(icon)}
                    >
                      {copiedId === icon.id
                        ? t.iconGenerator.copied
                        : t.iconGenerator.copySvg}
                    </button>
                    <button
                      type="button"
                      className="ig-chip"
                      onClick={() => downloadSvg(icon)}
                    >
                      {t.iconGenerator.downloadSvgOne}
                    </button>
                    <button
                      type="button"
                      className="ig-chip"
                      onClick={() => void downloadPng(icon)}
                    >
                      {t.iconGenerator.downloadPngOne}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="ig-credit">
          <a href={LUCIDE_URL} rel="noopener noreferrer" target="_blank">
            {t.iconGenerator.credit}
          </a>
        </p>
      </section>

      <section className="ig-section">
        <h2>{t.iconGenerator.exportHeading}</h2>

        <div className="ig-export">
          <div className="ig-field">
            <span className="ig-field-label">{t.iconGenerator.formatLabel}</span>
            <div className="ig-choices">
              <label className="ig-choice">
                <input
                  type="checkbox"
                  checked={exports.svg}
                  onChange={(event) =>
                    setExports({ ...exports, svg: event.target.checked })
                  }
                />
                {t.iconGenerator.formatSvg}
              </label>
              <label className="ig-choice">
                <input
                  type="checkbox"
                  checked={exports.png}
                  onChange={(event) =>
                    setExports({ ...exports, png: event.target.checked })
                  }
                />
                {t.iconGenerator.formatPng}
              </label>
            </div>
            {exports.svg && <p className="ig-hint">{t.iconGenerator.svgSizeNote}</p>}
          </div>

          {exports.png && (
            <div className="ig-field">
              <span className="ig-field-label">
                {t.iconGenerator.pngSizesLabel}
              </span>
              <div className="ig-choices">
                {PNG_SIZES.map((size) => (
                  <label key={size} className="ig-choice">
                    <input
                      type="checkbox"
                      checked={exports.pngSizes.includes(size)}
                      onChange={() => togglePngSize(size)}
                    />
                    {size}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ig-export-action">
          <button
            type="button"
            className="ig-btn ig-btn-primary"
            disabled={fileCount === 0 || zipping}
            onClick={() => void downloadZip()}
          >
            {zipping
              ? t.iconGenerator.zipping
              : // "Download 0 files" is a worse way of saying that nothing is
                // ready than simply not naming a number.
                fileCount === 0
                ? t.iconGenerator.downloadZipEmpty
                : t.iconGenerator.downloadZip(fileCount)}
          </button>
          {/* Says which of the two conditions is unmet, rather than leaving a
              disabled button with no explanation. */}
          {selectedIcons.length === 0 && (
            <p className="ig-hint">{t.iconGenerator.needSelection}</p>
          )}
          {selectedIcons.length > 0 && fileCount === 0 && (
            <p className="ig-hint">{t.iconGenerator.needFormat}</p>
          )}
        </div>

        {error && (
          <p className="ig-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <ToolGuide guide={t.iconGeneratorGuide} current={TOOL} />
    </main>
  );
}

export default IconGeneratorTool;
