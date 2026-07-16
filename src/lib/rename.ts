import type {
  DateFormat,
  RenameInput,
  RenameResult,
  RenameToken,
  TimeFormat,
} from './types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDate(date: Date, format: DateFormat): string {
  const yyyy = String(date.getFullYear());
  const m = date.getMonth() + 1;
  const d = date.getDate();
  switch (format) {
    case 'yyyy-mm-dd':
      return `${yyyy}-${pad2(m)}-${pad2(d)}`;
    case 'yyyy-m-d':
      return `${yyyy}-${m}-${d}`;
    case 'm-d':
      return `${m}-${d}`;
    case 'd-m-yyyy':
      return `${d}-${m}-${yyyy}`;
  }
}

export function formatTime(date: Date, format: TimeFormat): string {
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  switch (format) {
    case 'hh-mm-ss':
      return `${hh}-${mm}-${pad2(date.getSeconds())}`;
    case 'hh-mm':
      return `${hh}-${mm}`;
  }
}

export function formatNumericIndex(n: number, padding: 1 | 2 | 3): string {
  // padStart never truncates, so overflow (e.g. padding=2, n=100) stays "100".
  return String(n).padStart(padding, '0');
}

export function formatAlphaIndex(
  n: number,
  letterCase: 'lower' | 'upper',
): string {
  // Bijective base-26, same as Excel column names: 1→a, 26→z, 27→aa, ...
  let result = '';
  let rest = n;
  while (rest > 0) {
    rest -= 1;
    result = String.fromCharCode(97 + (rest % 26)) + result;
    rest = Math.floor(rest / 26);
  }
  return letterCase === 'upper' ? result.toUpperCase() : result;
}

export function splitExtension(fileName: string): {
  base: string;
  ext: string;
} {
  const dot = fileName.lastIndexOf('.');
  // dot === 0 is a dotfile like ".gitignore": the whole name is the base.
  if (dot <= 0) {
    return { base: fileName, ext: '' };
  }
  return { base: fileName.slice(0, dot), ext: fileName.slice(dot) };
}

// Parses 'yyyy-mm-dd' as a local date (new Date(string) would parse it as UTC
// and could shift the day depending on the time zone).
function parseFixedDate(fixedDate: string): Date {
  const [y, m, d] = fixedDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Parses 'hh:mm' or 'hh:mm:ss'; only the time-of-day fields matter.
function parseFixedTime(fixedTime: string): Date {
  const [h, m, s] = fixedTime.split(':').map(Number);
  return new Date(1970, 0, 1, h, m, s ?? 0);
}

export function buildFileName(
  tokens: RenameToken[],
  context: { index: number; fileDate: Date; now: Date },
): string {
  // context.index is the file's 0-based position in the list.
  return tokens
    .map((token) => {
      switch (token.kind) {
        case 'text':
          return token.value;
        case 'separator':
          return token.char;
        case 'date': {
          const date =
            token.source === 'fileModified'
              ? context.fileDate
              : token.fixedDate
                ? parseFixedDate(token.fixedDate)
                : context.now;
          return formatDate(date, token.format);
        }
        case 'time': {
          const time =
            token.source === 'fileModified'
              ? context.fileDate
              : token.fixedTime
                ? parseFixedTime(token.fixedTime)
                : context.now;
          return formatTime(time, token.format);
        }
        case 'index': {
          const n = token.start + context.index;
          return token.style.type === 'numeric'
            ? formatNumericIndex(n, token.style.padding)
            : formatAlphaIndex(n, token.style.letterCase);
        }
      }
    })
    .join('');
}

export function applyRename(
  inputs: RenameInput[],
  tokens: RenameToken[],
  options: { now: Date },
): RenameResult[] {
  const named = inputs.map((input, index) => {
    const { ext } = splitExtension(input.originalName);
    const base = buildFileName(tokens, {
      index,
      fileDate: new Date(input.lastModified),
      now: options.now,
    });
    return { originalName: input.originalName, newName: base + ext };
  });

  const counts = new Map<string, number>();
  for (const { newName } of named) {
    counts.set(newName, (counts.get(newName) ?? 0) + 1);
  }

  return named.map((result) => ({
    ...result,
    isDuplicate: (counts.get(result.newName) ?? 0) > 1,
  }));
}
