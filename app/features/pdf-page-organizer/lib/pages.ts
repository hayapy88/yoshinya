import type { PageItem } from './types';

/** Brings any angle back to the 0/90/180/270 a PDF can actually store. */
export function normalizeAngle(angle: number): number {
  const turns = Math.round(angle / 90) * 90;
  return ((turns % 360) + 360) % 360;
}

export function createPages(
  baseRotations: number[],
  makeId: (index: number) => string,
): PageItem[] {
  return baseRotations.map((angle, index) => {
    const rotation = normalizeAngle(angle);
    return {
      id: makeId(index),
      sourceIndex: index,
      baseRotation: rotation,
      rotation,
    };
  });
}

export function movePage(
  pages: PageItem[],
  from: number,
  to: number,
): PageItem[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= pages.length ||
    to >= pages.length
  ) {
    return pages;
  }
  const next = [...pages];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

/** Turns the given pages by a multiple of 90 degrees. */
export function rotatePages(
  pages: PageItem[],
  ids: Iterable<string>,
  delta: number,
): PageItem[] {
  const target = new Set(ids);
  if (target.size === 0) {
    return pages;
  }
  return pages.map((page) =>
    target.has(page.id)
      ? { ...page, rotation: normalizeAngle(page.rotation + delta) }
      : page,
  );
}

export function deletePages(
  pages: PageItem[],
  ids: Iterable<string>,
): PageItem[] {
  const target = new Set(ids);
  return pages.filter((page) => !target.has(page.id));
}

/** Keeps only the given pages, in the order they are currently in. */
export function keepOnly(pages: PageItem[], ids: Iterable<string>): PageItem[] {
  const target = new Set(ids);
  return pages.filter((page) => target.has(page.id));
}

export function reversePages(pages: PageItem[]): PageItem[] {
  return [...pages].reverse();
}

/** True once anything about the document has been changed. */
export function isEdited(pages: PageItem[], originalCount: number): boolean {
  return (
    pages.length !== originalCount ||
    pages.some(
      (page, index) =>
        page.sourceIndex !== index || page.rotation !== page.baseRotation,
    )
  );
}
