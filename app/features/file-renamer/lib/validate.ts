export type TextValueError = {
  code: 'invalidChars';
  chars: string; // space-separated unique offending characters
};

// Returns an error kind rather than a display message:
// converting to user-facing copy is the UI layer's job (see src/i18n/).
export function validateTextValue(value: string): TextValueError | null {
  const matches = value.match(/[/\\:*?"<>|]/g);
  if (!matches) {
    return null;
  }
  return { code: 'invalidChars', chars: [...new Set(matches)].join(' ') };
}
