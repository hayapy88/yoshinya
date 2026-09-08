// Guide copy quotes the names of buttons the reader is told to press, and a
// quoted name set in bold is far easier to find than one buried in prose. The
// dictionaries mark those runs with *asterisks* — the lightest markup that
// survives being a plain string in a typed dictionary — and this module is the
// single place that interprets them.
//
// Until this existed the markers were rendered literally, asterisks and all, on
// every English guide that used them.
const EMPHASIS = /\*([^*]+)\*/g;

export type EmphasisRun = { text: string; strong: boolean };

/**
 * Splits marked text into runs. An unmatched asterisk is not a marker and stays
 * in the text as typed.
 */
export function splitEmphasis(text: string): EmphasisRun[] {
  // A split on a pattern with one capture group alternates between the text
  // outside the match and the captured text inside it, so the odd indices are
  // exactly the emphasised runs.
  return text
    .split(EMPHASIS)
    .map((part, index) => ({ text: part, strong: index % 2 === 1 }))
    .filter((run) => run.text !== '');
}

/**
 * The same text with the markers removed and nothing else changed. For places
 * that need a plain string rather than markup — structured data above all,
 * where a stray asterisk would be published to search engines.
 */
export function stripEmphasis(text: string): string {
  return text.replace(EMPHASIS, '$1');
}
