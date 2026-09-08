// Scanners and cameras number their output without padding, so a plain string
// sort puts "10" before "2" and hands back an order nobody wants. Intl's
// numeric collation is what "name order" has to mean here, and it also sorts
// Japanese file names the way a file manager does.
const COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export function sortByName<T extends { fileName: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => COLLATOR.compare(a.fileName, b.fileName));
}

export function reverse<T>(items: T[]): T[] {
  return [...items].reverse();
}

/**
 * Moves one item to another position, for both the drag handle and the up/down
 * buttons. Out-of-range targets are clamped rather than rejected, so the button
 * at the end of the list is a no-op instead of an error path.
 */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length) {
    return items;
  }
  const target = Math.min(Math.max(to, 0), items.length - 1);
  if (target === from) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
}
