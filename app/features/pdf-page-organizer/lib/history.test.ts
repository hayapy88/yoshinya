import { describe, expect, it } from 'vitest';
import {
  canRedo,
  canUndo,
  initHistory,
  pushHistory,
  redo,
  undo,
} from './history';

describe('history', () => {
  it('starts with nothing to undo or redo', () => {
    const history = initHistory('a');
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);
  });

  it('steps back and forward through what was done', () => {
    let history = pushHistory(pushHistory(initHistory('a'), 'b'), 'c');
    history = undo(history);
    expect(history.present).toBe('b');
    history = undo(history);
    expect(history.present).toBe('a');
    history = redo(history);
    expect(history.present).toBe('b');
  });

  it('drops the redo stack once something new is done', () => {
    let history = pushHistory(initHistory('a'), 'b');
    history = undo(history);
    history = pushHistory(history, 'c');
    expect(canRedo(history)).toBe(false);
    expect(history.present).toBe('c');
  });

  it('does nothing at either end', () => {
    const history = initHistory('a');
    expect(undo(history)).toBe(history);
    expect(redo(history)).toBe(history);
  });

  it('keeps the last fifty steps and forgets the oldest', () => {
    let history = initHistory(0);
    for (let step = 1; step <= 60; step += 1) {
      history = pushHistory(history, step);
    }
    expect(history.past).toHaveLength(50);
    expect(history.past[0]).toBe(10);
    expect(history.present).toBe(60);
  });
});
