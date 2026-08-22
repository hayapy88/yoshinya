import { useLocale } from '~/i18n/locale'
import { pairedDimension, targetDimensions } from '../lib/resize'
import {
  needsBackground,
  resolveFormat,
  supportsQuality,
} from '../lib/settings'
import type {
  CompressionSettings,
  EncodableFormat,
  ImageItem,
  OutputFormat,
} from '../lib/types'

const FORMATS: OutputFormat[] = ['original', 'jpeg', 'png', 'webp']

export function SettingsPanel({
  settings,
  item,
  scope,
  hasOverride,
  bulkQualityCount,
  bulkAllCount,
  adjustedCount,
  totalCount,
  encodableFormats,
  disabled,
  onScopeChange,
  onChange,
  onResetToCommon,
  onApplyQualityToRest,
  onApplyAllToRest,
  onApplyToAll,
}: {
  settings: CompressionSettings
  item: ImageItem
  scope: 'common' | 'image'
  hasOverride: boolean
  bulkQualityCount: number
  bulkAllCount: number
  /** Images pinned by their own settings, which the shared settings skip. */
  adjustedCount: number
  totalCount: number
  /** What this browser can write. `null` while the probe is still running. */
  encodableFormats: ReadonlySet<EncodableFormat> | null
  disabled: boolean
  onScopeChange: (scope: 'common' | 'image') => void
  onChange: (patch: Partial<CompressionSettings>) => void
  onResetToCommon: () => void
  onApplyQualityToRest: () => void
  onApplyAllToRest: () => void
  onApplyToAll: () => void
}) {
  const { t } = useLocale()
  const format = resolveFormat(settings.outputFormat, item.sourceType)
  const showQuality = supportsQuality(format)
  const showBackground = needsBackground(format, item.sourceType)
  // An option is unavailable when the format it resolves to cannot be written.
  // Going through resolveFormat covers "keep original format", which is the
  // same dead end wearing a different name when the source is, say, a WebP on a
  // browser that reads WebP but cannot write it.
  const isUnavailable = (value: OutputFormat) =>
    encodableFormats !== null &&
    !encodableFormats.has(resolveFormat(value, item.sourceType))
  const anyUnavailable = FORMATS.some(isUnavailable)

  const source =
    item.sourceWidth && item.sourceHeight
      ? { width: item.sourceWidth, height: item.sourceHeight }
      : null
  const target = source ? targetDimensions(source, settings) : null

  const changeDimension = (edited: 'width' | 'height', raw: string) => {
    const value = raw === '' ? null : Number(raw)
    if (settings.keepAspectRatio && source && value !== null) {
      const partner = pairedDimension(source, edited, value)
      onChange(
        edited === 'width'
          ? { width: value, height: partner }
          : { height: value, width: partner },
      )
      return
    }
    onChange(edited === 'width' ? { width: value } : { height: value })
  }

  return (
    <section className="ic-settings" aria-labelledby="ic-settings-heading">
      <h2 id="ic-settings-heading">{t.imageCompressor.settingsHeading}</h2>

      {/* Which images an edit lands on has to be unmistakable — it is the
          difference between adjusting one photo and re-doing the batch. */}
      <fieldset className="ic-scope" disabled={disabled}>
        <legend>{t.imageCompressor.scopeLabel}</legend>
        <label>
          <input
            type="radio"
            name="ic-scope"
            checked={scope === 'common'}
            onChange={() => onScopeChange('common')}
          />
          {t.imageCompressor.scopeCommon}
        </label>
        <label>
          <input
            type="radio"
            name="ic-scope"
            checked={scope === 'image'}
            onChange={() => onScopeChange('image')}
          />
          {t.imageCompressor.scopeImage}
        </label>
      </fieldset>

      {scope === 'common' && adjustedCount > 0 && (
        <p className="ic-hint">
          {t.imageCompressor.scopeCommonNote(adjustedCount)}
        </p>
      )}

      {hasOverride && (
        <p className="ic-override-note">
          <span className="ic-badge ic-badge-custom">
            ● {t.imageCompressor.stateCustomized}
          </span>
          <button
            type="button"
            className="ic-linkbtn"
            onClick={onResetToCommon}
            disabled={disabled}
          >
            {t.imageCompressor.resetToCommon}
          </button>
        </p>
      )}

      <div className="ic-field">
        <label htmlFor="ic-format">{t.imageCompressor.formatLabel}</label>
        <select
          id="ic-format"
          value={settings.outputFormat}
          disabled={disabled}
          onChange={(e) =>
            onChange({ outputFormat: e.target.value as OutputFormat })
          }
        >
          {FORMATS.map((value) => (
            <option key={value} value={value} disabled={isUnavailable(value)}>
              {isUnavailable(value)
                ? t.imageCompressor.formatUnavailable(
                    t.imageCompressor.formats[value],
                  )
                : t.imageCompressor.formats[value]}
            </option>
          ))}
        </select>
        {anyUnavailable && (
          <p className="ic-hint">{t.imageCompressor.formatUnavailableHint}</p>
        )}
      </div>

      {showBackground && (
        <div className="ic-field">
          <label htmlFor="ic-bg">{t.imageCompressor.backgroundLabel}</label>
          <input
            id="ic-bg"
            type="color"
            value={settings.jpegBackground}
            disabled={disabled}
            onChange={(e) => onChange({ jpegBackground: e.target.value })}
          />
          <p className="ic-hint">{t.imageCompressor.backgroundHint}</p>
        </div>
      )}

      {showQuality ? (
        <div className="ic-field">
          <label htmlFor="ic-quality">
            {t.imageCompressor.qualityLabel} <strong>{settings.quality}</strong>
          </label>
          <div className="ic-quality-row">
            <input
              id="ic-quality"
              type="range"
              min={1}
              max={100}
              value={settings.quality}
              disabled={disabled}
              onChange={(e) => onChange({ quality: Number(e.target.value) })}
            />
            <input
              type="number"
              min={1}
              max={100}
              value={settings.quality}
              disabled={disabled}
              aria-label={t.imageCompressor.qualityLabel}
              onChange={(e) => onChange({ quality: Number(e.target.value) })}
            />
          </div>
          {/* The WebP quality curve is almost flat at the top: 99 loses about
              as much as 80 while producing a much larger file, and only 100
              switches the encoder to its lossless mode. Someone reaching for a
              high number is trying to avoid loss, so say where that actually
              is rather than letting them land in the worst spot. */}
          {format === 'webp' && settings.quality === 100 && (
            <p className="ic-hint ic-lossless">
              {t.imageCompressor.losslessAt100}
            </p>
          )}
          {format === 'webp' &&
            settings.quality >= 90 &&
            settings.quality < 100 && (
              <p className="ic-warn">
                {t.imageCompressor.qualityFlatTop}{' '}
                <button
                  type="button"
                  className="ic-linkbtn"
                  onClick={() => onChange({ quality: 100 })}
                >
                  {t.imageCompressor.useLossless}
                </button>
              </p>
            )}

          {/* Placed beside the slider: the value you just settled on is the
              value you want the rest to start from. */}
          <button
            type="button"
            className="ic-btn ic-btn-secondary ic-apply-rest"
            disabled={disabled || bulkQualityCount === 0}
            title={
              bulkQualityCount === 0
                ? t.imageCompressor.applyRestNone
                : undefined
            }
            onClick={onApplyQualityToRest}
          >
            {t.imageCompressor.applyQualityToRest(
              settings.quality,
              bulkQualityCount,
            )}
          </button>
        </div>
      ) : (
        // PNG gets its own control rather than the quality slider: the number
        // being chosen is a count of colours, not a quality percentage, and
        // labelling it "quality" would invite the same misreading that the WebP
        // curve already causes.
        <div className="ic-field">
          <label className="ic-check">
            <input
              type="checkbox"
              checked={settings.pngReduce}
              disabled={disabled}
              onChange={(e) => onChange({ pngReduce: e.target.checked })}
            />
            {t.imageCompressor.pngReduceLabel}
          </label>
          <p className="ic-hint">{t.imageCompressor.pngReduceHint}</p>

          {settings.pngReduce ? (
            /* Folded away on purpose. 256 is the most a palette PNG can hold,
               so every value this control offers makes the picture worse — and
               at 256 the file is already a fraction of the original, because
               most of the saving comes from storing one byte per pixel instead
               of four rather than from dropping colours. Someone tuning assets
               for a page can still reach it. */
            <details className="ic-details">
              <summary>{t.imageCompressor.pngMoreSettings}</summary>
              <label htmlFor="ic-png-colors">
                {t.imageCompressor.pngColorsLabel}{' '}
                <strong>{settings.pngColors}</strong>
              </label>
              <div className="ic-quality-row">
                <input
                  id="ic-png-colors"
                  type="range"
                  min={2}
                  max={256}
                  value={settings.pngColors}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange({ pngColors: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min={2}
                  max={256}
                  value={settings.pngColors}
                  disabled={disabled}
                  aria-label={t.imageCompressor.pngColorsLabel}
                  onChange={(e) =>
                    onChange({ pngColors: Number(e.target.value) })
                  }
                />
              </div>
              <label className="ic-check">
                <input
                  type="checkbox"
                  checked={settings.pngDither}
                  disabled={disabled}
                  onChange={(e) => onChange({ pngDither: e.target.checked })}
                />
                {t.imageCompressor.pngDitherLabel}
              </label>
              <p className="ic-hint">{t.imageCompressor.pngDitherHint}</p>
            </details>
          ) : (
            <p className="ic-hint ic-lossless">
              {t.imageCompressor.pngLosslessOff}
            </p>
          )}
        </div>
      )}

      <details className="ic-details">
        <summary>{t.imageCompressor.resizeHeading}</summary>
        <label className="ic-check">
          <input
            type="checkbox"
            checked={settings.resizeEnabled}
            disabled={disabled}
            // Seeded with the image's real size, so the fields start from
            // something meaningful. Left empty, a first press of the number
            // spinner jumps to 1 — a value nobody wants and a confusing place
            // to start adjusting from.
            onChange={(e) =>
              onChange(
                e.target.checked &&
                  source &&
                  settings.width === null &&
                  settings.height === null
                  ? {
                      resizeEnabled: true,
                      width: source.width,
                      height: source.height,
                    }
                  : { resizeEnabled: e.target.checked },
              )
            }
          />
          {t.imageCompressor.resizeEnable}
        </label>

        {settings.resizeEnabled && (
          <>
            <div className="ic-dims">
              <div className="ic-field">
                <label htmlFor="ic-width">{t.imageCompressor.widthLabel}</label>
                <input
                  id="ic-width"
                  type="number"
                  min={1}
                  value={settings.width ?? ''}
                  disabled={disabled}
                  onChange={(e) => changeDimension('width', e.target.value)}
                />
              </div>
              <div className="ic-field">
                <label htmlFor="ic-height">
                  {t.imageCompressor.heightLabel}
                </label>
                <input
                  id="ic-height"
                  type="number"
                  min={1}
                  value={settings.height ?? ''}
                  disabled={disabled}
                  onChange={(e) => changeDimension('height', e.target.value)}
                />
              </div>
            </div>
            <label className="ic-check">
              <input
                type="checkbox"
                checked={settings.keepAspectRatio}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ keepAspectRatio: e.target.checked })
                }
              />
              {t.imageCompressor.keepRatio}
            </label>
            <label className="ic-check">
              <input
                type="checkbox"
                checked={settings.preventUpscale}
                disabled={disabled}
                onChange={(e) => onChange({ preventUpscale: e.target.checked })}
              />
              {t.imageCompressor.preventUpscale}
            </label>
            {target?.isDistorted && (
              <p className="ic-warn">{t.imageCompressor.distortWarning}</p>
            )}
            {target && source && (
              <p className="ic-hint">
                {t.imageCompressor.dimensionsPreview(
                  source.width,
                  source.height,
                  target.width,
                  target.height,
                )}
              </p>
            )}
          </>
        )}
      </details>

      <details className="ic-details">
        <summary>{t.imageCompressor.moreActions}</summary>
        <button
          type="button"
          className="ic-btn ic-btn-secondary"
          disabled={disabled || bulkAllCount === 0}
          onClick={onApplyAllToRest}
        >
          {t.imageCompressor.applyAllToRest(bulkAllCount)}
        </button>
        <p className="ic-hint">{t.imageCompressor.applyAllHint}</p>
        <button
          type="button"
          className="ic-btn ic-btn-secondary"
          disabled={disabled || totalCount === 0}
          onClick={onApplyToAll}
        >
          {t.imageCompressor.applyToAll(totalCount)}
        </button>
      </details>

      <p className="ic-hint">{t.imageCompressor.metadataNote}</p>
    </section>
  )
}
