import type { IconCategory, IconDefinition } from './icon-data';

// What the dictionaries provide for each icon: the name shown under it, and a
// space-separated list of the words someone might search for instead. The
// Japanese dictionary carries Japanese synonyms, so a search for 「家」 finds
// the house icon without the user knowing it is called `house`.
export type IconLabel = { name: string; keywords: string };

export type CategoryFilter = IconCategory | 'all';

/**
 * Narrows the grid by category and free text.
 *
 * Terms are ANDed: someone typing two words is adding a condition, not
 * widening the search. Each term may match the icon's English id, its English
 * tags, its localized name, or its localized keywords, because the user has no
 * way of knowing which of those the word they thought of lives in.
 */
export function filterIcons(
  icons: IconDefinition[],
  query: string,
  category: CategoryFilter,
  labels: Record<string, IconLabel>,
): IconDefinition[] {
  const byCategory =
    category === 'all'
      ? icons
      : icons.filter((icon) => icon.category === category);

  // Split on the ideographic space too — a Japanese keyboard produces it
  // without the user noticing, and it would otherwise become part of the term.
  const terms = query
    .trim()
    .toLowerCase()
    .split(/[\s　]+/)
    .filter((term) => term.length > 0);
  if (terms.length === 0) {
    return byCategory;
  }

  return byCategory.filter((icon) => {
    const label = labels[icon.id];
    const haystack = [
      icon.id,
      icon.tags.join(' '),
      label?.name ?? '',
      label?.keywords ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
