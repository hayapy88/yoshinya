import { useEffect, useId, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import {
  buildPayload,
  EMPTY_FIELDS,
  QR_MODES,
  type QrFields,
  type QrMode,
  type WifiSecurity,
} from './lib/payload';
import {
  buildMatrix,
  ERROR_CORRECTIONS,
  exportSize,
  MARGIN_MAX,
  MARGIN_MIN,
  QrCapacityError,
  renderSvg,
  SIZE_MAX,
  SIZE_MIN,
  type ErrorCorrection,
  type QrMatrix,
} from './lib/qr';
import { parseBulk } from './lib/bulk';
import { matrixToPngBlob, saveBlob, svgBlob } from './lib/export';
import { assessColors, DEFAULT_DARK, DEFAULT_LIGHT } from './lib/colors';
import { normalizeHex } from '~/lib/color';
import {
  LOGO_RATIO_MAX,
  LOGO_RATIO_MIN,
  LOGO_TYPES,
  readLogo,
  rejectLogo,
  type LogoRejection,
} from './lib/logo';
import {
  TEXT_MAX_LENGTH,
  TEXT_RATIO_MAX,
  TEXT_RATIO_MIN,
} from './lib/text';
import {
  DEFAULT_SETTINGS,
  readSettings,
  writeSettings,
  type StoredSettings,
} from './lib/settings';
import './qr-code-generator.css';

const TOOL = 'qr-code-generator' as const;

type Strings = ReturnType<typeof useLocale>['t']['qrCodeGenerator'];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  // The hint sits outside the <label> on purpose: nested, it becomes part of
  // the field's accessible name, and a screen reader then reads the whole
  // explanation before every control.
  return (
    <div className="qr-field">
      <label className="qr-field-control">
        <span className="qr-field-label">{label}</span>
        {children}
      </label>
      {hint && <span className="qr-field-hint">{hint}</span>}
    </div>
  );
}

/**
 * A colour, as a swatch and as a hex box side by side.
 *
 * The hex box is the point. A native colour picker hides its hex field behind
 * a mode switch, so someone handed "#162E64" by a brand guide has to go
 * looking for the place to type it; here the field is simply on the page, and
 * the swatch is the shortcut rather than the only way in.
 */
function ColorField({
  label,
  pickerLabel,
  hint,
  invalidMessage,
  value,
  onChange,
}: {
  label: string;
  pickerLabel: string;
  hint: string;
  invalidMessage: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [touched, setTouched] = useState(false);
  const fieldId = useId();

  // Follows changes made elsewhere — the swatch, or the reset link.
  useEffect(() => {
    setDraft(value);
    setTouched(false);
  }, [value]);

  const invalid = touched && normalizeHex(draft) === null;

  return (
    <div className="qr-field">
      {/* The visible label names the hex box rather than the swatch: the
          swatch already shows what it is. */}
      <label className="qr-field-label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="qr-color-row">
        <input
          type="color"
          className="qr-color-picker"
          value={value}
          aria-label={pickerLabel}
          onChange={(event) => onChange(normalizeHex(event.target.value) ?? value)}
        />
        <input
          id={fieldId}
          type="text"
          className="qr-color-text"
          value={draft}
          spellCheck={false}
          autoComplete="off"
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
      <span className="qr-field-hint">{invalid ? invalidMessage : hint}</span>
    </div>
  );
}

function ModeFields({
  mode,
  fields,
  set,
  s,
}: {
  mode: QrMode;
  fields: QrFields;
  set: (next: Partial<QrFields>) => void;
  s: Strings;
}) {
  if (mode === 'url') {
    return (
      <Field label={s.urlLabel} hint={s.urlHint}>
        <input
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={s.urlPlaceholder}
          value={fields.url}
          onChange={(event) => set({ url: event.target.value })}
        />
      </Field>
    );
  }

  if (mode === 'text') {
    return (
      <Field label={s.textLabel}>
        <textarea
          rows={4}
          placeholder={s.textPlaceholder}
          value={fields.text}
          onChange={(event) => set({ text: event.target.value })}
        />
      </Field>
    );
  }

  if (mode === 'wifi') {
    const wifi = fields.wifi;
    return (
      <div className="qr-fields">
        <Field label={s.wifiSsid}>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={s.wifiSsidPlaceholder}
            value={wifi.ssid}
            onChange={(event) =>
              set({ wifi: { ...wifi, ssid: event.target.value } })
            }
          />
        </Field>
        <Field label={s.wifiSecurity}>
          <select
            value={wifi.security}
            onChange={(event) =>
              set({
                wifi: { ...wifi, security: event.target.value as WifiSecurity },
              })
            }
          >
            {(['WPA', 'WEP', 'nopass'] as WifiSecurity[]).map((option) => (
              <option key={option} value={option}>
                {s.wifiSecurityOptions[option]}
              </option>
            ))}
          </select>
        </Field>
        {wifi.security !== 'nopass' && (
          <Field label={s.wifiPassword}>
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={wifi.password}
              onChange={(event) =>
                set({ wifi: { ...wifi, password: event.target.value } })
              }
            />
          </Field>
        )}
        <label className="qr-check">
          <input
            type="checkbox"
            checked={wifi.hidden}
            onChange={(event) =>
              set({ wifi: { ...wifi, hidden: event.target.checked } })
            }
          />
          <span>{s.wifiHidden}</span>
        </label>
        <p className="qr-note">{s.wifiNote}</p>
      </div>
    );
  }

  if (mode === 'vcard') {
    const card = fields.vcard;
    const text = (
      key: keyof typeof card,
      label: string,
      type = 'text',
    ) => (
      <Field label={label}>
        <input
          type={type}
          autoComplete="off"
          value={card[key]}
          onChange={(event) =>
            set({ vcard: { ...card, [key]: event.target.value } })
          }
        />
      </Field>
    );
    return (
      <div className="qr-fields qr-fields-grid">
        {text('lastName', s.vcardLastName)}
        {text('firstName', s.vcardFirstName)}
        {text('organization', s.vcardOrganization)}
        {text('title', s.vcardTitle)}
        {text('phone', s.vcardPhone, 'tel')}
        {text('email', s.vcardEmail, 'email')}
        {text('url', s.vcardUrl, 'url')}
      </div>
    );
  }

  const mail = fields.email;
  return (
    <div className="qr-fields">
      <Field label={s.emailTo}>
        <input
          type="email"
          autoComplete="off"
          value={mail.to}
          onChange={(event) => set({ email: { ...mail, to: event.target.value } })}
        />
      </Field>
      <Field label={s.emailSubject}>
        <input
          type="text"
          value={mail.subject}
          onChange={(event) =>
            set({ email: { ...mail, subject: event.target.value } })
          }
        />
      </Field>
      <Field label={s.emailBody}>
        <textarea
          rows={3}
          value={mail.body}
          onChange={(event) =>
            set({ email: { ...mail, body: event.target.value } })
          }
        />
      </Field>
      <p className="qr-note">{s.emailNote}</p>
    </div>
  );
}

export default function QrCodeGeneratorTool() {
  const { t } = useLocale();
  const s = t.qrCodeGenerator;

  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [restored, setRestored] = useState(false);
  const [fields, setFields] = useState<QrFields>(EMPTY_FIELDS);
  const [bulkText, setBulkText] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [skippedNames, setSkippedNames] = useState<string[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoRejection, setLogoRejection] = useState<LogoRejection | null>(null);
  const [logoForcedEc, setLogoForcedEc] = useState(false);
  const [centerText, setCenterText] = useState('');
  const opened = useRef(false);

  // Settings are read after mount rather than during render: the server has no
  // localStorage, and reading it during render would make the first paint
  // differ from the HTML it is hydrating.
  useEffect(() => {
    const stored = readSettings();
    setSettings(stored.settings);
    setRestored(stored.restored);
  }, []);

  const update = (next: Partial<StoredSettings>) => {
    setSettings((current) => {
      const merged = { ...current, ...next };
      writeSettings(merged);
      return merged;
    });
  };

  const noteFirstInput = () => {
    if (!opened.current) {
      opened.current = true;
      track('tool_opened', { tool: TOOL });
    }
  };

  const setFieldValues = (next: Partial<QrFields>) => {
    noteFirstInput();
    setFields((current) => ({ ...current, ...next }));
  };

  const payload = buildPayload(settings.mode, fields);
  const colors = assessColors(settings.dark, settings.light);
  // Memoised so the matrix render below is not redone on every keystroke.
  const logoOptions = useMemo(
    () =>
      logo && settings.centerType === 'logo'
        ? { href: logo, ratio: settings.logoRatio }
        : null,
    [logo, settings.centerType, settings.logoRatio],
  );

  // Null text colour means "follow the code colour", which is what a brand
  // asks for before it asks for anything else.
  const textColor = settings.textColor ?? settings.dark;
  const textOptions = useMemo(
    () =>
      settings.centerType === 'text' && centerText.trim()
        ? { value: centerText, color: textColor, ratio: settings.textRatio }
        : null,
    [settings.centerType, centerText, textColor, settings.textRatio],
  );

  /** Anything covering the middle needs the level that can rebuild it. */
  const raiseErrorCorrection = () => {
    if (settings.errorCorrection !== 'H') {
      update({ errorCorrection: 'H' });
      setLogoForcedEc(true);
    }
  };

  const chooseLogo = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    const rejection = rejectLogo(file);
    setLogoRejection(rejection);
    if (rejection) {
      return;
    }
    noteFirstInput();
    setLogo(await readLogo(file));
    // A logo is damage the code has to survive, so the level that can rebuild
    // the most is the only sensible one to be on.
    raiseErrorCorrection();
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoRejection(null);
    setLogoForcedEc(false);
  };

  const result = useMemo((): { matrix: QrMatrix | null; tooLong: boolean } => {
    if (!payload) {
      return { matrix: null, tooLong: false };
    }
    try {
      return { matrix: buildMatrix(payload, settings.errorCorrection), tooLong: false };
    } catch (error) {
      if (error instanceof QrCapacityError) {
        return { matrix: null, tooLong: true };
      }
      throw error;
    }
  }, [payload, settings.errorCorrection]);

  const svg = useMemo(
    () =>
      result.matrix
        ? renderSvg(result.matrix, {
            margin: settings.margin,
            dark: settings.dark,
            light: settings.light,
            logo: logoOptions,
            text: textOptions,
          })
        : null,
    [
      result.matrix,
      settings.margin,
      settings.dark,
      settings.light,
      logoOptions,
      textOptions,
    ],
  );

  const png = result.matrix
    ? exportSize(result.matrix, settings.margin, settings.size)
    : null;

  const downloadPng = async () => {
    if (!result.matrix || !png) {
      return;
    }
    const blob = await matrixToPngBlob(
      result.matrix,
      png.scale,
      settings.margin,
      { dark: settings.dark, light: settings.light },
      logoOptions,
      textOptions,
    );
    saveBlob(blob, 'qr-code.png');
    track('download_completed', {
      tool: TOOL,
      file_count: 1,
      mode: settings.mode,
    });
  };

  const downloadSvg = () => {
    if (!svg) {
      return;
    }
    saveBlob(svgBlob(svg), 'qr-code.svg');
    track('download_completed', {
      tool: TOOL,
      file_count: 1,
      mode: settings.mode,
    });
  };

  const bulk = useMemo(() => parseBulk(bulkText), [bulkText]);

  const generateZip = async () => {
    setBulkBusy(true);
    setBulkError('');
    setSkippedNames([]);
    try {
      const zip = new JSZip();
      const skipped: string[] = [];
      for (const entry of bulk.entries) {
        let matrix: QrMatrix;
        try {
          matrix = buildMatrix(entry.value, settings.errorCorrection);
        } catch (error) {
          if (error instanceof QrCapacityError) {
            // One over-long row must not cost the other 199 codes.
            skipped.push(entry.name);
            continue;
          }
          throw error;
        }
        const { scale } = exportSize(matrix, settings.margin, settings.size);
        zip.file(
          `${entry.name}.png`,
          await matrixToPngBlob(
            matrix,
            scale,
            settings.margin,
            { dark: settings.dark, light: settings.light },
            logoOptions,
            textOptions,
          ),
        );
      }
      setSkippedNames(skipped);
      const archive = await zip.generateAsync({ type: 'blob' });
      saveBlob(archive, 'qr-codes.zip');
      track('download_completed', {
        tool: TOOL,
        file_count: bulk.entries.length - skipped.length,
        action: 'bulk_zip',
      });
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : String(error));
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <main className="qr-page">
      <ToolIntro
        heading={t.qrCodeGeneratorPage.heading}
        lead={t.qrCodeGeneratorPage.lead}
        privacyNote={t.qrCodeGeneratorPage.privacyNote}
      />

      <section className="qr-section" aria-labelledby="qr-input-heading">
        <h2 id="qr-input-heading">{s.inputHeading}</h2>
        <div className="qr-modes" role="tablist" aria-label={s.inputHeading}>
          {QR_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={settings.mode === mode}
              className={`qr-mode${settings.mode === mode ? ' qr-mode-on' : ''}`}
              onClick={() => update({ mode })}
            >
              {s.modes[mode]}
            </button>
          ))}
        </div>
        <ModeFields
          mode={settings.mode}
          fields={fields}
          set={setFieldValues}
          s={s}
        />
      </section>

      <section className="qr-section" aria-labelledby="qr-options-heading">
        <h2 id="qr-options-heading">{s.optionsHeading}</h2>
        {restored && <p className="qr-restored">{s.restored}</p>}
        <div className="qr-options">
          <Field label={s.errorCorrection} hint={s.errorCorrectionHint}>
            <select
              value={settings.errorCorrection}
              onChange={(event) =>
                update({
                  errorCorrection: event.target.value as ErrorCorrection,
                })
              }
            >
              {ERROR_CORRECTIONS.map((level) => (
                <option key={level} value={level}>
                  {s.errorCorrectionOptions[level]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={s.size} hint={s.sizeHint}>
            <input
              type="number"
              min={SIZE_MIN}
              max={SIZE_MAX}
              step={32}
              value={settings.size}
              onChange={(event) =>
                update({ size: Number(event.target.value) || DEFAULT_SETTINGS.size })
              }
            />
          </Field>
          <Field label={s.margin} hint={s.marginHint}>
            <input
              type="number"
              min={MARGIN_MIN}
              max={MARGIN_MAX}
              value={settings.margin}
              onChange={(event) => update({ margin: Number(event.target.value) })}
            />
          </Field>
        </div>

        <h3 className="qr-subheading">{s.colorsHeading}</h3>
        <div className="qr-options">
          <ColorField
            label={s.darkColor}
            pickerLabel={s.colorPicker(s.darkColor)}
            hint={s.colorHexHint}
            invalidMessage={s.colorHexInvalid}
            value={settings.dark}
            onChange={(dark) => update({ dark })}
          />
          <ColorField
            label={s.lightColor}
            pickerLabel={s.colorPicker(s.lightColor)}
            hint={s.colorHexHint}
            invalidMessage={s.colorHexInvalid}
            value={settings.light}
            onChange={(light) => update({ light })}
          />
        </div>
        <button
          type="button"
          className="qr-text-btn"
          onClick={() => update({ dark: DEFAULT_DARK, light: DEFAULT_LIGHT })}
        >
          {s.resetColors}
        </button>
        {colors.inverted && <p className="qr-warning">{s.invertedWarning}</p>}
        {colors.lowContrast && (
          <p className="qr-warning">
            {s.contrastWarning(colors.ratio.toFixed(1))}
          </p>
        )}

        <h3 className="qr-subheading">{s.centerHeading}</h3>
        {/* Radios rather than tabs: these choose what the code carries, not
            which panel is on top, and the payload tabs above already use the
            tab role — two tablists with a "Text" in each is a maze. */}
        <div className="qr-modes" role="radiogroup" aria-label={s.centerHeading}>
          {(['none', 'logo', 'text'] as const).map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={settings.centerType === type}
              className={`qr-mode${settings.centerType === type ? ' qr-mode-on' : ''}`}
              onClick={() => {
                update({ centerType: type });
                if (type !== 'none') {
                  raiseErrorCorrection();
                }
              }}
            >
              {type === 'none'
                ? s.centerNone
                : type === 'logo'
                  ? s.centerLogo
                  : s.centerText}
            </button>
          ))}
        </div>

        {logoForcedEc && (
          <p className="qr-restored">{s.logoForcedErrorCorrection}</p>
        )}

        {settings.centerType === 'logo' && (
          <>
            <div className="qr-logo">
              <label className="qr-btn qr-logo-choose">
                {s.logoChoose}
                <input
                  type="file"
                  accept={LOGO_TYPES.join(',')}
                  onChange={(event) => chooseLogo(event.target.files?.[0])}
                />
              </label>
              {logo && (
                <>
                  <img className="qr-logo-preview" src={logo} alt={s.logoAlt} />
                  <button type="button" className="qr-btn" onClick={removeLogo}>
                    {s.logoRemove}
                  </button>
                </>
              )}
            </div>
            {logo && (
              <Field
                label={`${s.logoSize}: ${s.logoSizeValue(
                  String(Math.round(settings.logoRatio * 100)),
                )}`}
              >
                <input
                  type="range"
                  min={LOGO_RATIO_MIN * 100}
                  max={LOGO_RATIO_MAX * 100}
                  step={1}
                  value={Math.round(settings.logoRatio * 100)}
                  onChange={(event) =>
                    update({ logoRatio: Number(event.target.value) / 100 })
                  }
                />
              </Field>
            )}
            {logoRejection && (
              <p className="qr-warning">
                {logoRejection === 'type'
                  ? s.logoRejectedType
                  : s.logoRejectedSize}
              </p>
            )}
            {logo && <p className="qr-note">{s.logoNote}</p>}
          </>
        )}

        {settings.centerType === 'text' && (
          <>
            <div className="qr-options">
              <Field label={s.textValue}>
                <input
                  type="text"
                  maxLength={TEXT_MAX_LENGTH}
                  placeholder={s.textValuePlaceholder}
                  value={centerText}
                  onChange={(event) => {
                    noteFirstInput();
                    setCenterText(event.target.value);
                    if (event.target.value.trim()) {
                      raiseErrorCorrection();
                    }
                  }}
                />
              </Field>
              <ColorField
                label={s.textColor}
                pickerLabel={s.colorPicker(s.textColor)}
                hint={s.colorHexHint}
                invalidMessage={s.colorHexInvalid}
                value={textColor}
                onChange={(color) => update({ textColor: color })}
              />
              <Field
                label={`${s.textSize}: ${s.textSizeValue(
                  String(Math.round(settings.textRatio * 100)),
                )}`}
              >
                <input
                  type="range"
                  min={TEXT_RATIO_MIN * 100}
                  max={TEXT_RATIO_MAX * 100}
                  step={1}
                  value={Math.round(settings.textRatio * 100)}
                  onChange={(event) =>
                    update({ textRatio: Number(event.target.value) / 100 })
                  }
                />
              </Field>
            </div>
            {settings.textColor !== null && (
              <button
                type="button"
                className="qr-text-btn"
                onClick={() => update({ textColor: null })}
              >
                {s.textMatchCode}
              </button>
            )}
            {centerText.trim() && <p className="qr-note">{s.textNote}</p>}
          </>
        )}
      </section>

      <section className="qr-section" aria-labelledby="qr-preview-heading">
        <h2 id="qr-preview-heading">{s.previewHeading}</h2>
        <div className="qr-result">
          <div className="qr-preview">
            {svg ? (
              // Built here from the module matrix: the markup contains numbers
              // and colours only, never anything that was typed.
              <div
                className="qr-preview-image"
                role="img"
                aria-label={t.qrCodeGeneratorPage.toolName}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <p className="qr-empty">
                {result.tooLong ? s.tooLong : s.emptyHint}
              </p>
            )}
          </div>
          <div className="qr-actions">
            <button
              type="button"
              className="qr-btn qr-btn-primary"
              disabled={!result.matrix}
              onClick={downloadPng}
            >
              {s.downloadPng}
            </button>
            <button
              type="button"
              className="qr-btn"
              disabled={!result.matrix}
              onClick={downloadSvg}
            >
              {s.downloadSvg}
            </button>
            {png && (
              <p className="qr-size">
                {s.actualSize(String(png.size))}
                <span className="qr-field-hint">{s.actualSizeHint}</span>
              </p>
            )}
            <p className="qr-field-hint">{s.svgHint}</p>
          </div>
        </div>
      </section>

      <section className="qr-section" aria-labelledby="qr-bulk-heading">
        <h2 id="qr-bulk-heading">{s.bulkHeading}</h2>
        <p className="qr-hint" id="qr-bulk-hint">
          {s.bulkHint}
        </p>
        <textarea
          className="qr-bulk-input"
          aria-labelledby="qr-bulk-heading"
          aria-describedby="qr-bulk-hint"
          rows={6}
          placeholder={s.bulkPlaceholder}
          value={bulkText}
          onChange={(event) => {
            noteFirstInput();
            setBulkText(event.target.value);
          }}
        />
        <p className="qr-bulk-count">
          {bulk.entries.length > 0
            ? s.bulkCount(String(bulk.entries.length))
            : s.bulkEmpty}
        </p>
        {bulk.skipped > 0 && (
          <p className="qr-warning">{s.bulkLimit(String(bulk.skipped))}</p>
        )}
        <button
          type="button"
          className="qr-btn qr-btn-primary"
          disabled={bulk.entries.length === 0 || bulkBusy}
          onClick={generateZip}
        >
          {bulkBusy ? s.bulkWorking : s.bulkGenerate}
        </button>
        {skippedNames.map((name) => (
          <p key={name} className="qr-warning">
            {s.bulkTooLong(name)}
          </p>
        ))}
        {bulkError && <p className="qr-warning">{s.bulkFailed(bulkError)}</p>}
      </section>

      <p className="qr-trademark">{s.trademark}</p>

      <ToolGuide guide={t.qrCodeGeneratorGuide} current={TOOL} />
    </main>
  );
}
