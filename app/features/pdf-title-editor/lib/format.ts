const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

// Sizes are shown next to file names, so keep them short: one decimal place
// above kilobytes, none below.
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} ${UNITS[0]}`;
  }
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${UNITS[unit]}`;
}
