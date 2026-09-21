import {
  SCHEMA_TYPES,
  SCHEMA_TYPE_IDS,
  isSchemaTypeId,
  type SchemaTypeId,
} from './schemas';
import { emptyValues, isRepeat, type RepeatItem, type Values } from './values';

export const STORAGE_KEY = 'yoshinya:structured-data-generator:v1';
// A company's name and address are the same next month; a draft of an article
// from a month ago is not something anyone comes back for.
export const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

export type StoredState = {
  selected: SchemaTypeId;
  values: Record<SchemaTypeId, Values>;
};

export function defaultState(): StoredState {
  return {
    selected: 'article',
    values: Object.fromEntries(
      SCHEMA_TYPE_IDS.map((id) => [id, emptyValues(SCHEMA_TYPES[id])]),
    ) as Record<SchemaTypeId, Values>,
  };
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// Rebuilds one type's values from whatever was stored, field by field against
// the current schema. A field that has since been renamed is simply blank,
// and a stored value of the wrong shape is ignored rather than trusted.
function restoreValues(id: SchemaTypeId, raw: unknown): Values {
  const schema = SCHEMA_TYPES[id];
  const values = emptyValues(schema);
  if (typeof raw !== 'object' || raw === null) {
    return values;
  }
  const stored = raw as Record<string, unknown>;
  for (const field of schema.fields) {
    const entry = stored[field.id];
    if (isRepeat(field)) {
      if (!Array.isArray(entry)) {
        continue;
      }
      const rows: RepeatItem[] = entry
        .filter((item) => typeof item === 'object' && item !== null)
        .map((item) =>
          Object.fromEntries(
            field.fields.map((sub) => [
              sub.id,
              str((item as Record<string, unknown>)[sub.id]) ||
                (sub.kind === 'select' ? (sub.options?.[0] ?? '') : ''),
            ]),
          ),
        );
      if (rows.length > 0) {
        values[field.id] = rows;
      }
    } else if (typeof entry === 'string') {
      if (field.kind === 'select' && !field.options?.includes(entry)) {
        continue;
      }
      values[field.id] = entry;
    }
  }
  return values;
}

export function parseStored(raw: string | null, now: number): StoredState {
  const state = defaultState();
  if (!raw) {
    return state;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return state;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return state;
  }
  const record = parsed as Record<string, unknown>;
  if (typeof record.savedAt !== 'number' || now - record.savedAt > RETENTION_MS) {
    return state;
  }
  if (isSchemaTypeId(record.selected)) {
    state.selected = record.selected;
  }
  const values =
    typeof record.values === 'object' && record.values !== null
      ? (record.values as Record<string, unknown>)
      : {};
  for (const id of SCHEMA_TYPE_IDS) {
    state.values[id] = restoreValues(id, values[id]);
  }
  return state;
}

export function serializeStored(state: StoredState, now: number): string {
  return JSON.stringify({ ...state, savedAt: now });
}
