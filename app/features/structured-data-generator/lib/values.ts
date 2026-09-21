import type { AnyField, Field, RepeatField, SchemaType } from './schemas';

export type RepeatItem = Record<string, string>;
// Keyed by field id. Plain fields hold the raw input; repeat fields hold one
// record per row, keyed by sub-field id.
export type Values = Record<string, string | RepeatItem[]>;

export function isRepeat(field: AnyField): field is RepeatField {
  return field.kind === 'repeat';
}

function defaultFor(field: Field): string {
  return field.kind === 'select' ? (field.options?.[0] ?? '') : '';
}

export function emptyItem(field: RepeatField): RepeatItem {
  return Object.fromEntries(field.fields.map((sub) => [sub.id, defaultFor(sub)]));
}

// A repeat field starts with one blank row: an empty list would hide the
// controls the row carries, and the first thing anyone does is add a row.
export function emptyValues(schema: SchemaType): Values {
  return Object.fromEntries(
    schema.fields.map((field) => [
      field.id,
      isRepeat(field) ? [emptyItem(field)] : defaultFor(field),
    ]),
  );
}

export function setField(values: Values, id: string, value: string): Values {
  return { ...values, [id]: value };
}

function rows(values: Values, id: string): RepeatItem[] {
  const current = values[id];
  return Array.isArray(current) ? current : [];
}

export function setRepeatField(
  values: Values,
  id: string,
  index: number,
  subId: string,
  value: string,
): Values {
  const current = rows(values, id);
  if (index < 0 || index >= current.length) {
    return values;
  }
  const next = current.slice();
  next[index] = { ...current[index], [subId]: value };
  return { ...values, [id]: next };
}

export function addRepeatItem(
  values: Values,
  field: RepeatField,
): Values {
  return { ...values, [field.id]: [...rows(values, field.id), emptyItem(field)] };
}

// The last row stays: removing it would leave nothing to type into, and
// clearing a row is what someone who wants it empty actually means.
export function removeRepeatItem(
  values: Values,
  id: string,
  index: number,
): Values {
  const current = rows(values, id);
  if (current.length <= 1 || index < 0 || index >= current.length) {
    return values;
  }
  return { ...values, [id]: current.filter((_, i) => i !== index) };
}

export function moveRepeatItem(
  values: Values,
  id: string,
  from: number,
  to: number,
): Values {
  const current = rows(values, id);
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= current.length ||
    to >= current.length
  ) {
    return values;
  }
  const next = current.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return { ...values, [id]: next };
}

// True when nothing but defaults has been entered, which is what "clear"
// should be disabled on and what the storage code need not save.
export function isPristine(schema: SchemaType, values: Values): boolean {
  return JSON.stringify(values) === JSON.stringify(emptyValues(schema));
}
