// Characters that are invalid or risky in file/folder names across OSes,
// plus ASCII control characters. Spaces and hyphens are valid and kept.
// eslint-disable-next-line no-control-regex
const INVALID_CHARS = /[/\\:*?"<>|\x00-\x1f]/g;

const MAX_NAME_LENGTH = 100;

// Makes a string safe to use as a ZIP folder name: strips invalid characters,
// removes trailing dots/spaces (which Windows rejects), and caps the length.
// Returns the fallback when nothing usable remains.
export function sanitizeFolderName(name: string, fallback = 'folder'): string {
  const cleaned = name
    .replace(INVALID_CHARS, '_')
    .replace(/[\s.]+$/g, '')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : fallback;
}

// Splits a file name into its base and extension (including the dot). Mirrors
// the File Renamer rule: a leading dot (dotfile) is part of the base.
export function splitExtension(fileName: string): {
  base: string;
  ext: string;
} {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) {
    return { base: fileName, ext: '' };
  }
  return { base: fileName.slice(0, dot), ext: fileName.slice(dot) };
}

// Returns a name unique within `used` (case-insensitive), appending " (2)",
// " (3)", … before the extension when needed. Records the result in `used`.
export function uniquifyName(name: string, used: Set<string>): string {
  const key = name.toLowerCase();
  if (!used.has(key)) {
    used.add(key);
    return name;
  }
  const { base, ext } = splitExtension(name);
  let n = 2;
  let candidate = `${base} (${n})${ext}`;
  while (used.has(candidate.toLowerCase())) {
    n += 1;
    candidate = `${base} (${n})${ext}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}
