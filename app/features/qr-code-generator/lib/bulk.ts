/**
 * Parses the bulk box: one QR code per line.
 *
 * The format has to survive being pasted straight out of a spreadsheet, so a
 * line is either a bare value or `name,value` — the name becoming the file
 * name inside the ZIP. Anything else a spreadsheet adds (blank rows, a header
 * commented out) is ignored rather than turned into a QR code of its own.
 */

export const BULK_LIMIT = 200;

export type BulkEntry = {
  /** File name without extension, already made safe and unique. */
  name: string;
  value: string;
};

export type BulkParse = {
  entries: BulkEntry[];
  /** How many lines were dropped because the limit was reached. */
  skipped: number;
};

/** Windows forbids these outright; control characters break archive readers. */
// eslint-disable-next-line no-control-regex
const UNSAFE = /[\\/:*?"<>|\u0000-\u001f]/g;

export function safeFileName(raw: string, fallback: string): string {
  const cleaned = raw.replace(UNSAFE, '').trim().slice(0, 60);
  // A name made only of dots names a directory entry on every platform.
  return cleaned && !/^\.+$/.test(cleaned) ? cleaned : fallback;
}

/**
 * Splits `name,value` on the first comma only: a URL with query parameters
 * contains commas of its own, and splitting on all of them would cut the
 * address in half.
 */
function splitLine(line: string): { name: string | null; value: string } {
  const comma = line.indexOf(',');
  if (comma < 0) {
    return { name: null, value: line.trim() };
  }
  return {
    name: line.slice(0, comma).trim(),
    value: line.slice(comma + 1).trim(),
  };
}

export function parseBulk(input: string): BulkParse {
  const entries: BulkEntry[] = [];
  const used = new Map<string, number>();
  let skipped = 0;

  for (const raw of input.split(/\r\n|\r|\n/)) {
    const line = raw.trim();
    // `#` is how a pasted spreadsheet header gets kept for reference without
    // becoming a QR code.
    if (!line || line.startsWith('#')) {
      continue;
    }
    if (entries.length >= BULK_LIMIT) {
      skipped += 1;
      continue;
    }
    const { name, value } = splitLine(line);
    if (!value) {
      continue;
    }
    const base = safeFileName(name ?? '', `qr-${entries.length + 1}`);
    // Two rows named the same would overwrite each other inside the ZIP, so
    // the second one onwards carries a counter.
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    entries.push({ name: seen === 0 ? base : `${base}-${seen + 1}`, value });
  }

  return { entries, skipped };
}
