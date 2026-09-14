// Undo and redo for the page list.
//
// Deleting thirty pages with one click is the whole point of the tool, and it
// is also the mistake nobody can recover from without this. What is kept is the
// page list — a small array of ids and angles — never the thumbnails, so fifty
// steps of history cost almost nothing.

export type History<T> = {
  past: T[];
  present: T;
  future: T[];
};

const LIMIT = 50;

export function initHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export function pushHistory<T>(history: History<T>, next: T): History<T> {
  return {
    past: [...history.past, history.present].slice(-LIMIT),
    present: next,
    // Editing after an undo abandons what was undone. Keeping it would let a
    // redo reinstate pages that no longer belong to the document in front of
    // the user.
    future: [],
  };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}

export function undo<T>(history: History<T>): History<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) {
    return history;
  }
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: History<T>): History<T> {
  const [next, ...rest] = history.future;
  if (next === undefined) {
    return history;
  }
  return {
    past: [...history.past, history.present],
    present: next,
    future: rest,
  };
}
