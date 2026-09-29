import { useMemo, useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import { countText, type Counts } from './lib/count';
import { evaluateTargets, type TargetResult } from './lib/targets';
import './character-counter.css';

const TOOL = 'character-counter' as const;

type Strings = ReturnType<typeof useLocale>['t']['characterCounter'];

// Thousands separators throughout: a six-figure byte count is unreadable
// without them, and the locale the page is in is the right one to use.
function useFormat() {
  const { locale } = useLocale();
  return useMemo(() => new Intl.NumberFormat(locale), [locale]);
}

function Tile({
  label,
  value,
  primary = false,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div className={`cc-tile${primary ? ' cc-tile-primary' : ''}`}>
      <span className="cc-tile-value">{value}</span>
      <span className="cc-tile-label">{label}</span>
    </div>
  );
}

function TargetRow({
  result,
  s,
  format,
}: {
  result: TargetResult;
  s: Strings;
  format: Intl.NumberFormat;
}) {
  // Halves only appear on the full-width-equivalent targets, and only when a
  // narrow character made one; an integer should not show as "30.0".
  const used = Number.isInteger(result.used)
    ? format.format(result.used)
    : result.used.toFixed(1);
  const over = Math.abs(result.remaining);

  return (
    <li className={`cc-target${result.over ? ' cc-target-over' : ''}`}>
      <div className="cc-target-head">
        <span className="cc-target-name">{s.targets[result.id]}</span>
        <span className="cc-target-count">
          {used} / {format.format(result.limit)}
        </span>
      </div>
      <div
        className="cc-bar"
        role="progressbar"
        aria-label={s.targets[result.id]}
        aria-valuenow={Math.round(result.ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className="cc-bar-fill"
          style={{ inlineSize: `${result.ratio * 100}%` }}
        />
      </div>
      <p className="cc-target-note">
        {result.over
          ? s.overBy(Number.isInteger(over) ? format.format(over) : over.toFixed(1))
          : s.remaining(
              Number.isInteger(result.remaining)
                ? format.format(result.remaining)
                : result.remaining.toFixed(1),
            )}
      </p>
    </li>
  );
}

export default function CharacterCounterTool() {
  const { t } = useLocale();
  const s = t.characterCounter;
  const format = useFormat();
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opened = useRef(false);

  const counts: Counts = useMemo(() => countText(text), [text]);
  const targets = useMemo(() => evaluateTargets(counts), [counts]);

  // Typing is what "using the tool" means here, so the event belongs on the
  // first keystroke rather than on mount, where every crawler would fire it.
  const noteFirstInput = () => {
    if (!opened.current) {
      opened.current = true;
      track('tool_opened', { tool: TOOL });
    }
  };

  const summary = [
    `${s.characters}: ${format.format(counts.characters)}`,
    `${s.charactersNoWhitespace}: ${format.format(counts.charactersNoWhitespace)}`,
    `${s.words}: ${format.format(counts.words)}`,
    `${s.lines}: ${format.format(counts.lines)}`,
  ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      track('batch_action', { tool: TOOL, action: 'copy_counts' });
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the numbers are on screen to read.
    }
  };

  return (
    <main className="cc-page">
      <ToolIntro
        heading={t.characterCounterPage.heading}
        lead={t.characterCounterPage.lead}
        privacyNote={t.characterCounterPage.privacyNote}
      />

      <section className="cc-section" aria-labelledby="cc-input-heading">
        <div className="cc-section-head">
          <h2 id="cc-input-heading">{s.inputHeading}</h2>
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            disabled={text === ''}
            onClick={() => setText('')}
          >
            {s.clear}
          </button>
        </div>
        <textarea
          className="cc-input"
          value={text}
          rows={12}
          placeholder={s.placeholder}
          aria-label={s.inputLabel}
          onChange={(event) => {
            noteFirstInput();
            setText(event.target.value);
          }}
        />
      </section>

      <section className="cc-section" aria-labelledby="cc-counts-heading">
        <div className="cc-section-head">
          <h2 id="cc-counts-heading">{s.countsHeading}</h2>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={text === ''}
            onClick={copy}
          >
            {copied ? s.copied : s.copy}
          </button>
        </div>

        <div className="cc-tiles">
          <Tile
            primary
            label={s.characters}
            value={format.format(counts.characters)}
          />
          <Tile
            primary
            label={s.charactersNoWhitespace}
            value={format.format(counts.charactersNoWhitespace)}
          />
          <Tile label={s.words} value={format.format(counts.words)} />
          <Tile label={s.lines} value={format.format(counts.lines)} />
          <Tile label={s.paragraphs} value={format.format(counts.paragraphs)} />
        </div>

        <table className="cc-detail">
          <tbody>
            <tr>
              <th scope="row">{s.widthBreakdown}</th>
              <td>
                {s.widthValue(
                  format.format(counts.fullWidth),
                  format.format(counts.halfWidth),
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">{s.weighted}</th>
              <td>{format.format(counts.weighted)}</td>
            </tr>
            <tr>
              <th scope="row">{s.manuscript}</th>
              <td>
                {s.manuscriptValue(
                  format.format(counts.manuscript.sheets),
                  format.format(counts.manuscript.rows),
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">{s.utf8Bytes}</th>
              <td>{format.format(counts.utf8Bytes)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="cc-section" aria-labelledby="cc-targets-heading">
        <h2 id="cc-targets-heading">{s.targetsHeading}</h2>
        <p className="cc-hint">{s.targetsHint}</p>
        <ul className="cc-targets">
          {targets.map((result) => (
            <TargetRow
              key={result.id}
              result={result}
              s={s}
              format={format}
            />
          ))}
        </ul>
      </section>

      <ToolGuide guide={t.characterCounterGuide} current={TOOL} />
    </main>
  );
}
