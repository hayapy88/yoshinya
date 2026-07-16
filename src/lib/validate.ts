const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g;

export function validateTextValue(value: string): string | null {
  const matches = value.match(INVALID_FILENAME_CHARS);
  if (!matches) {
    return null;
  }
  const unique = [...new Set(matches)].join(' ');
  return `ファイル名に使えない文字が含まれています: ${unique}`;
}
