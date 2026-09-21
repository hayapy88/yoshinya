import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import { buildJsonLd, serializeJsonLd } from './lib/build';
import {
  SCHEMA_TYPES,
  SCHEMA_TYPE_IDS,
  type Field,
  type FieldId,
  type RepeatField,
  type SchemaTypeId,
} from './lib/schemas';
import {
  STORAGE_KEY,
  defaultState,
  parseStored,
  serializeStored,
  type StoredState,
} from './lib/storage';
import {
  addRepeatItem,
  emptyValues,
  isPristine,
  isRepeat,
  moveRepeatItem,
  removeRepeatItem,
  setField,
  setRepeatField,
  type RepeatItem,
  type Values,
} from './lib/values';
import './structured-data.css';

const TOOL = 'structured-data-generator' as const;
const RICH_RESULTS_TEST = 'https://search.google.com/test/rich-results';
const SCHEMA_VALIDATOR = 'https://validator.schema.org/';

type Strings = ReturnType<typeof useLocale>['t']['structuredData'];

function fieldLabel(t: Strings, id: string): string {
  return t.fields[id as FieldId] ?? id;
}

function fieldHint(t: Strings, id: string): string | undefined {
  return (t.hints as Partial<Record<string, string>>)[id];
}

function placeholder(
  t: Strings,
  typeId: SchemaTypeId,
  id: string,
): string | undefined {
  const table = t.placeholders as Partial<Record<string, string>>;
  return table[`${typeId}.${id}`] ?? table[id];
}

function optionLabel(t: Strings, option: string): string {
  return (t.options as Partial<Record<string, string>>)[option] ?? option;
}

function inputTypeFor(field: Field): string {
  switch (field.kind) {
    case 'url':
      return 'url';
    case 'date':
      return 'datetime-local';
    default:
      return 'text';
  }
}

/** One labelled control. The hint, when there is one, sits under the input,
    so the inputs in a row line up whether or not their neighbours have one. */
function FieldControl({
  field,
  typeId,
  value,
  onChange,
  t,
}: {
  field: Field;
  typeId: SchemaTypeId;
  value: string;
  onChange: (value: string) => void;
  t: Strings;
}) {
  const id = useId();
  const hint = fieldHint(t, field.id);
  const example = placeholder(t, typeId, field.id);
  const hintId = hint ? `${id}-hint` : undefined;
  const multiline = field.kind === 'textarea' || field.kind === 'lines';
  const wide = multiline || field.wide;

  return (
    <div className={`sd-field${wide ? ' sd-field-wide' : ''}`}>
      <label className="sd-label" htmlFor={id}>
        {fieldLabel(t, field.id)}
        {field.required && (
          <span className="sd-required">{t.requiredBadge}</span>
        )}
      </label>
      {field.kind === 'select' ? (
        <select
          id={id}
          className="sd-input"
          value={value}
          aria-describedby={hintId}
          onChange={(event) => onChange(event.target.value)}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {optionLabel(t, option)}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          id={id}
          className="sd-input"
          value={value}
          rows={field.kind === 'lines' ? 3 : 4}
          placeholder={example}
          aria-describedby={hintId}
          spellCheck={field.kind === 'textarea'}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          className="sd-input"
          type={inputTypeFor(field)}
          // Numbers are typed into a text field on purpose: a number input
          // rejects "1,200" silently and adds spinners nobody wants on a price.
          inputMode={field.kind === 'number' ? 'decimal' : undefined}
          value={value}
          placeholder={example}
          aria-describedby={hintId}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint && (
        <p id={hintId} className="sd-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

function RepeatControl({
  field,
  typeId,
  rows,
  onChange,
  t,
}: {
  field: RepeatField;
  typeId: SchemaTypeId;
  rows: RepeatItem[];
  onChange: (next: (values: Values) => Values) => void;
  t: Strings;
}) {
  return (
    <fieldset className="sd-repeat">
      <legend className="sd-label">{fieldLabel(t, field.id)}</legend>
      {rows.map((row, index) => (
        <div key={index} className="sd-row">
          <div className="sd-row-head">
            <span className="sd-row-label">{t.rowLabel(index + 1)}</span>
            <div className="sd-row-actions">
              <button
                type="button"
                className="sd-btn sd-btn-secondary"
                disabled={index === 0}
                onClick={() =>
                  onChange((v) => moveRepeatItem(v, field.id, index, index - 1))
                }
              >
                {t.moveUp}
              </button>
              <button
                type="button"
                className="sd-btn sd-btn-secondary"
                disabled={index === rows.length - 1}
                onClick={() =>
                  onChange((v) => moveRepeatItem(v, field.id, index, index + 1))
                }
              >
                {t.moveDown}
              </button>
              <button
                type="button"
                className="sd-btn sd-btn-secondary"
                disabled={rows.length <= 1}
                onClick={() =>
                  onChange((v) => removeRepeatItem(v, field.id, index))
                }
              >
                {t.removeRow}
              </button>
            </div>
          </div>
          <div className="sd-grid">
            {field.fields.map((sub) => (
              <FieldControl
                key={sub.id}
                field={sub}
                typeId={typeId}
                value={row[sub.id] ?? ''}
                t={t}
                onChange={(value) =>
                  onChange((v) =>
                    setRepeatField(v, field.id, index, sub.id, value),
                  )
                }
              />
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="sd-btn sd-btn-secondary sd-add"
        onClick={() => onChange((v) => addRepeatItem(v, field))}
      >
        {t.addRow}
      </button>
    </fieldset>
  );
}

export default function StructuredDataTool() {
  const { t } = useLocale();
  const s = t.structuredData;
  const [state, setState] = useState<StoredState>(defaultState);
  const [wrap, setWrap] = useState(true);
  const [comment, setComment] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [restored, setRestored] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Nothing is written back until the saved entries have been read, or the
  // first render would overwrite them with the defaults.
  const loaded = useRef(false);

  useEffect(() => {
    track('tool_opened', { tool: TOOL });
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = parseStored(raw, Date.now());
      setState(saved);
      setRestored(
        SCHEMA_TYPE_IDS.some(
          (id) => !isPristine(SCHEMA_TYPES[id], saved.values[id]),
        ),
      );
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
      localStorage.setItem(STORAGE_KEY, serializeStored(state, Date.now()));
    } catch {
      // Same as above: remembering is a convenience, not a requirement.
    }
  }, [state]);

  const schema = SCHEMA_TYPES[state.selected];
  const values = state.values[state.selected];

  const updateValues = (next: (values: Values) => Values) => {
    setState((current) => ({
      ...current,
      values: {
        ...current.values,
        [current.selected]: next(current.values[current.selected]),
      },
    }));
  };

  const code = useMemo(() => {
    const data = buildJsonLd(schema, values);
    return serializeJsonLd(data, {
      wrap,
      comment: comment
        ? s.commentText(s.types[state.selected].name, String(data['@type']))
        : undefined,
    });
  }, [schema, values, wrap, comment, s, state.selected]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyError(false);
      setCopied(true);
      track('batch_action', {
        tool: TOOL,
        action: 'copy_code',
        mode: state.selected,
      });
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  const pristine = isPristine(schema, values);

  return (
    <main className="sd-page">
      <ToolIntro
        heading={t.structuredDataPage.heading}
        lead={t.structuredDataPage.lead}
        privacyNote={t.structuredDataPage.privacyNote}
      />

      <section className="sd-section" aria-labelledby="sd-type-heading">
        <h2 id="sd-type-heading">{s.typeHeading}</h2>
        <div className="sd-types" role="radiogroup" aria-labelledby="sd-type-heading">
          {SCHEMA_TYPE_IDS.map((id) => (
            <label
              key={id}
              className={`sd-type${state.selected === id ? ' sd-type-on' : ''}`}
            >
              <input
                type="radio"
                name="sd-type"
                value={id}
                checked={state.selected === id}
                onChange={() =>
                  setState((current) => ({ ...current, selected: id }))
                }
              />
              <span className="sd-type-name">{s.types[id].name}</span>
              <span className="sd-type-description">
                {s.types[id].description}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="sd-section" aria-labelledby="sd-form-heading">
        <div className="sd-section-head">
          <h2 id="sd-form-heading">{s.formHeading}</h2>
          <button
            type="button"
            className="sd-btn sd-btn-secondary"
            disabled={pristine}
            onClick={() => updateValues(() => emptyValues(schema))}
          >
            {s.clear}
          </button>
        </div>
        <p className="sd-hint">{s.requiredHint}</p>
        {restored && (
          <p className="sd-restored" role="status">
            {s.restored}
          </p>
        )}
        <form
          className="sd-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="sd-grid">
            {schema.fields.map((field) =>
              isRepeat(field) ? (
                <RepeatControl
                  key={`${schema.id}-${field.id}`}
                  field={field}
                  typeId={schema.id}
                  rows={
                    Array.isArray(values[field.id])
                      ? (values[field.id] as RepeatItem[])
                      : []
                  }
                  onChange={updateValues}
                  t={s}
                />
              ) : (
                <FieldControl
                  key={`${schema.id}-${field.id}`}
                  field={field}
                  typeId={schema.id}
                  value={
                    typeof values[field.id] === 'string'
                      ? (values[field.id] as string)
                      : ''
                  }
                  t={s}
                  onChange={(value) =>
                    updateValues((v) => setField(v, field.id, value))
                  }
                />
              ),
            )}
          </div>
        </form>
      </section>

      <section className="sd-section" aria-labelledby="sd-code-heading">
        <h2 id="sd-code-heading">{s.codeHeading}</h2>
        <div className="sd-output">
          <div className="sd-code-panel">
            <div className="sd-code-bar">
              <div className="sd-checks">
                <label className="sd-check">
                  <input
                    type="checkbox"
                    checked={wrap}
                    onChange={(event) => setWrap(event.target.checked)}
                  />
                  {s.wrapInScript}
                </label>
                {/* An HTML comment needs the tag around it, so the option
                    greys out rather than silently doing nothing. */}
                <label className="sd-check">
                  <input
                    type="checkbox"
                    checked={comment}
                    disabled={!wrap}
                    onChange={(event) => setComment(event.target.checked)}
                  />
                  {s.includeComment}
                </label>
              </div>
              <button
                type="button"
                className="sd-btn sd-btn-primary"
                onClick={copy}
              >
                {copied ? s.copied : s.copy}
              </button>
            </div>
            {copyError && (
              <p className="sd-error" role="alert">
                {s.copyFailed}
              </p>
            )}
            <pre className="sd-code" tabIndex={0}>
              <code>{code}</code>
            </pre>
          </div>

          <aside className="sd-where">
            <h3>{s.whereHeading}</h3>
            <p className="sd-placement">{s.types[state.selected].placement}</p>
            <p>{s.whereGeneral}</p>
            <h3>{s.validateHeading}</h3>
            <p>{s.validateBody}</p>
            <ul className="sd-links">
              <li>
                <a href={RICH_RESULTS_TEST} target="_blank" rel="noopener noreferrer">
                  {s.richResultsTest}
                </a>
              </li>
              <li>
                <a href={SCHEMA_VALIDATOR} target="_blank" rel="noopener noreferrer">
                  {s.schemaValidator}
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <ToolGuide guide={t.structuredDataGuide} current={TOOL} />
    </main>
  );
}
