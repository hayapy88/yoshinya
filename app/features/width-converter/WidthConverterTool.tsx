import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import {
  CATEGORIES,
  convertText,
  type Category,
  type ConvertSettings,
  type Direction,
} from './lib/convert';
import {
  DEFAULT_SETTINGS,
  EXCLUDE_MAX,
  isDefault,
  readSettings,
  writeSettings,
} from './lib/settings';
import './width-converter.css';

const TOOL = 'width-converter' as const;

type Strings = ReturnType<typeof useLocale>['t']['widthConverter'];

// Letters and digits read most naturally as "make it half-width", katakana as
// "make it full-width" — so each row lists its usual choice first.
const ORDER: Record<Category, Direction[]> = {
  alnum: ['half', 'full', 'keep'],
  kana: ['full', 'half', 'keep'],
  symbol: ['half', 'full', 'keep'],
  space: ['half', 'full', 'keep'],
};

function RuleRow({
  category,
  value,
  onChange,
  s,
}: {
  category: Category;
  value: Direction;
  onChange: (direction: Direction) => void;
  s: Strings;
}) {
  const name = useId();
  return (
    <fieldset className="wc-rule">
      <legend className="wc-rule-legend">
        <span className="wc-rule-name">{s.categories[category]}</span>
        <span className="wc-rule-example">{s.examples[category]}</span>
      </legend>
      <div className="wc-choices">
        {ORDER[category].map((direction) => (
          <label key={direction} className="wc-choice">
            <input
              type="radio"
              name={name}
              value={direction}
              checked={value === direction}
              onChange={() => onChange(direction)}
            />
            <span>{s.directions[direction]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function WidthConverterTool() {
  const { t, locale } = useLocale();
  const s = t.widthConverter;
  const format = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const [text, setText] = useState('');
  const [settings, setSettings] = useState<ConvertSettings>(DEFAULT_SETTINGS);
  const [restored, setRestored] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opened = useRef(false);
  const excludeId = useId();
  const excludeHintId = useId();

  // Read after mount: the server has no localStorage, and reading during
  // render would make the first paint differ from the HTML being hydrated.
  useEffect(() => {
    const stored = readSettings();
    setSettings(stored.settings);
    setRestored(stored.restored);
  }, []);

  const update = (next: Partial<ConvertSettings>) => {
    setSettings((current) => {
      const merged = { ...current, ...next };
      writeSettings(merged);
      return merged;
    });
  };

  const result = useMemo(() => convertText(text, settings), [text, settings]);
  const total = CATEGORIES.reduce(
    (sum, category) => sum + result.counts[category],
    0,
  );

  // Pasting is what "using the tool" means here, so the event belongs on the
  // first input rather than on mount, where every crawler would fire it.
  const noteFirstInput = () => {
    if (!opened.current) {
      opened.current = true;
      track('tool_opened', { tool: TOOL });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      track('batch_action', { tool: TOOL, action: 'copy_result' });
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the result is on screen to select.
    }
  };

  return (
    <main className="wc-page">
      <ToolIntro
        heading={t.widthConverterPage.heading}
        lead={t.widthConverterPage.lead}
        privacyNote={t.widthConverterPage.privacyNote}
      />

      <section className="wc-section" aria-labelledby="wc-input-heading">
        <div className="wc-section-head">
          <h2 id="wc-input-heading">{s.inputHeading}</h2>
          <button
            type="button"
            className="wc-btn wc-btn-secondary"
            disabled={text === ''}
            onClick={() => setText('')}
          >
            {s.clear}
          </button>
        </div>
        <textarea
          className="wc-text"
          value={text}
          rows={10}
          placeholder={s.placeholder}
          aria-label={s.inputLabel}
          onChange={(event) => {
            noteFirstInput();
            setText(event.target.value);
          }}
        />
      </section>

      <section className="wc-section" aria-labelledby="wc-rules-heading">
        <div className="wc-section-head">
          <h2 id="wc-rules-heading">{s.rulesHeading}</h2>
          <button
            type="button"
            className="wc-btn wc-btn-secondary"
            disabled={isDefault(settings)}
            onClick={() => update(DEFAULT_SETTINGS)}
          >
            {s.resetRules}
          </button>
        </div>
        {restored && <p className="wc-hint">{s.restored}</p>}
        <div className="wc-rules">
          {CATEGORIES.map((category) => (
            <RuleRow
              key={category}
              category={category}
              value={settings[category]}
              onChange={(direction) => update({ [category]: direction })}
              s={s}
            />
          ))}
        </div>
        <div className="wc-exclude">
          <label htmlFor={excludeId} className="wc-exclude-label">
            {s.excludeLabel}
          </label>
          <input
            id={excludeId}
            type="text"
            className="wc-exclude-input"
            value={settings.exclude}
            maxLength={EXCLUDE_MAX}
            placeholder={s.excludePlaceholder}
            aria-describedby={excludeHintId}
            onChange={(event) => update({ exclude: event.target.value })}
          />
          <p id={excludeHintId} className="wc-hint">
            {s.excludeHint}
          </p>
        </div>
      </section>

      <section className="wc-section" aria-labelledby="wc-result-heading">
        <div className="wc-section-head">
          <h2 id="wc-result-heading">{s.resultHeading}</h2>
          <button
            type="button"
            className="wc-btn wc-btn-primary"
            disabled={text === ''}
            onClick={copy}
          >
            {copied ? s.copied : s.copy}
          </button>
        </div>

        {text !== '' && (
          <p className="wc-summary" aria-live="polite">
            {total === 0 ? s.noChanges : s.changed(format.format(total))}
            {total > 0 && (
              <span className="wc-counts">
                {CATEGORIES.filter(
                  (category) => result.counts[category] > 0,
                ).map((category) => (
                  <span key={category} className="wc-count">
                    {s.categories[category]}{' '}
                    <strong>{format.format(result.counts[category])}</strong>
                  </span>
                ))}
              </span>
            )}
          </p>
        )}

        <div
          className="wc-text wc-output"
          role="region"
          aria-label={s.resultLabel}
          tabIndex={0}
        >
          {text === '' ? (
            <span className="wc-empty">{s.empty}</span>
          ) : (
            result.segments.map((segment, index) =>
              segment.changed ? (
                <mark key={index} className="wc-mark">
                  {segment.text}
                </mark>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )
          )}
        </div>
        {total > 0 && <p className="wc-hint">{s.highlightHint}</p>}
      </section>

      <ToolGuide guide={t.widthConverterGuide} current={TOOL} />
    </main>
  );
}
