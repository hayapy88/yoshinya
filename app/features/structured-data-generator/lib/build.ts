import type { Field, RepeatField, SchemaType } from './schemas';
import { isRepeat, type RepeatItem, type Values } from './values';

export type JsonLd = Record<string, unknown>;

type Node = Record<string, unknown>;

// A select always has a value, so on its own it says nothing about whether the
// person meant to fill the object in. Only a typed value makes an object real;
// a select rides along once something else is there.
function isActive(field: Field): boolean {
  return field.kind !== 'select';
}

function parseValue(field: Field, raw: string): unknown {
  const text = raw.trim();
  if (text === '') {
    return undefined;
  }
  switch (field.kind) {
    case 'lines': {
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line !== '');
      return lines.length > 0 ? lines : undefined;
    }
    case 'number': {
      const number = Number(text);
      return Number.isFinite(number) ? number : undefined;
    }
    case 'select':
      return field.optionPrefix ? `${field.optionPrefix}${text}` : text;
    default:
      return text;
  }
}

function setPath(node: Node, path: string[], value: unknown): void {
  let cursor = node;
  for (const key of path.slice(0, -1)) {
    const next = cursor[key];
    if (typeof next !== 'object' || next === null) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Node;
  }
  cursor[path[path.length - 1]] = value;
}

/**
 * Removes every object that holds no typed value, then stamps the declared
 * @type on those that remain. Runs after all values are placed, so an address
 * with one line filled in keeps its type and an untouched one disappears
 * entirely rather than appearing as `{ "@type": "PostalAddress" }`.
 */
function finalize(
  node: Node,
  active: Set<string>,
  nestedTypes: Record<string, string>,
  prefix = '',
): boolean {
  let hasActive = false;
  for (const key of Object.keys(node)) {
    const value = node[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (finalize(value as Node, active, nestedTypes, path)) {
        hasActive = true;
        const type = nestedTypes[path];
        if (type) {
          (node[key] as Node) = { '@type': type, ...(value as Node) };
        }
      } else {
        delete node[key];
      }
    } else if (active.has(path)) {
      hasActive = true;
    }
  }
  return hasActive;
}

function buildNode(
  fields: Field[],
  values: Record<string, string>,
  nestedTypes: Record<string, string>,
): Node | null {
  const node: Node = {};
  const active = new Set<string>();
  for (const field of fields) {
    const raw = values[field.id];
    const value = parseValue(field, typeof raw === 'string' ? raw : '');
    if (value === undefined) {
      continue;
    }
    setPath(node, field.path, value);
    if (isActive(field)) {
      active.add(field.path.join('.'));
    }
  }
  return finalize(node, active, nestedTypes) ? node : null;
}

function buildRepeat(field: RepeatField, items: RepeatItem[]): Node[] {
  const built: Node[] = [];
  for (const item of items) {
    const node = buildNode(field.fields, item, field.nestedTypes ?? {});
    if (node) {
      built.push(node);
    }
  }
  return built.map((node, index) => ({
    '@type': field.itemType,
    ...(field.autoPosition ? { position: index + 1 } : {}),
    ...node,
  }));
}

/**
 * Turns the form into a JSON-LD object. Only what was filled in comes out:
 * empty fields, empty rows and objects with nothing typed into them are all
 * left out, so the result is never a scaffold of blank strings.
 */
export function buildJsonLd(schema: SchemaType, values: Values): JsonLd {
  const plain = schema.fields.filter((field) => !isRepeat(field));
  const scalar: Record<string, string> = {};
  for (const field of plain) {
    const raw = values[field.id];
    scalar[field.id] = typeof raw === 'string' ? raw : '';
  }

  const node: Node = {};
  const active = new Set<string>();
  let type = schema.type;
  for (const field of plain) {
    const value = parseValue(field, scalar[field.id]);
    if (value === undefined) {
      continue;
    }
    if (field.path.length === 1 && field.path[0] === '@type') {
      type = String(value);
      continue;
    }
    setPath(node, field.path, value);
    if (isActive(field)) {
      active.add(field.path.join('.'));
    }
  }
  finalize(node, active, schema.nestedTypes);

  for (const field of schema.fields) {
    if (isRepeat(field)) {
      const items = values[field.id];
      const built = buildRepeat(field, Array.isArray(items) ? items : []);
      if (built.length > 0) {
        setPath(node, field.path, built);
      }
    }
  }

  return { '@context': 'https://schema.org', '@type': type, ...node };
}

/**
 * Pretty-prints the object, optionally inside the script tag it is pasted
 * as. `<` is escaped so a value containing `</script>` cannot end the tag
 * early — JSON parsers read `\u003c` back as `<`, so nothing is lost.
 */
export function serializeJsonLd(
  data: JsonLd,
  options: { wrap: boolean },
): string {
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  return options.wrap
    ? `<script type="application/ld+json">\n${json}\n</script>`
    : json;
}
