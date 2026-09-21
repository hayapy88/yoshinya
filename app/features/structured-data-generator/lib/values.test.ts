import { describe, expect, it } from 'vitest';
import { SCHEMA_TYPES, type RepeatField } from './schemas';
import {
  addRepeatItem,
  emptyValues,
  isPristine,
  moveRepeatItem,
  removeRepeatItem,
  setField,
  setRepeatField,
} from './values';

const faq = SCHEMA_TYPES.faq;
const entries = faq.fields[0] as RepeatField;

describe('emptyValues', () => {
  it('gives selects their first option and everything else a blank', () => {
    const values = emptyValues(SCHEMA_TYPES.product);
    expect(values.priceCurrency).toBe('JPY');
    expect(values.availability).toBe('InStock');
    expect(values.name).toBe('');
  });

  it('starts a repeat field with one blank row', () => {
    expect(emptyValues(faq).entries).toEqual([{ question: '', answer: '' }]);
  });
});

describe('repeat rows', () => {
  it('adds, edits and removes rows without mutating the input', () => {
    const start = emptyValues(faq);
    const added = addRepeatItem(start, entries);
    expect(start.entries).toHaveLength(1);
    expect(added.entries).toHaveLength(2);

    const edited = setRepeatField(added, 'entries', 1, 'question', 'Q2');
    expect((added.entries as { question: string }[])[1].question).toBe('');
    expect((edited.entries as { question: string }[])[1].question).toBe('Q2');

    const removed = removeRepeatItem(edited, 'entries', 0);
    expect(removed.entries).toEqual([{ question: 'Q2', answer: '' }]);
  });

  it('never removes the last row', () => {
    const start = emptyValues(faq);
    expect(removeRepeatItem(start, 'entries', 0)).toBe(start);
  });

  it('ignores edits and moves outside the list', () => {
    const start = emptyValues(faq);
    expect(setRepeatField(start, 'entries', 3, 'question', 'x')).toBe(start);
    expect(moveRepeatItem(start, 'entries', 0, 1)).toBe(start);
    expect(moveRepeatItem(start, 'entries', 0, 0)).toBe(start);
  });

  it('moves a row up and down', () => {
    let values = emptyValues(faq);
    values = addRepeatItem(values, entries);
    values = addRepeatItem(values, entries);
    values = setRepeatField(values, 'entries', 0, 'question', 'A');
    values = setRepeatField(values, 'entries', 1, 'question', 'B');
    values = setRepeatField(values, 'entries', 2, 'question', 'C');
    const questions = (v: typeof values) =>
      (v.entries as { question: string }[]).map((row) => row.question);
    expect(questions(moveRepeatItem(values, 'entries', 2, 0))).toEqual([
      'C',
      'A',
      'B',
    ]);
    expect(questions(moveRepeatItem(values, 'entries', 0, 1))).toEqual([
      'B',
      'A',
      'C',
    ]);
  });
});

describe('isPristine', () => {
  it('is true until something is typed', () => {
    const values = emptyValues(SCHEMA_TYPES.organization);
    expect(isPristine(SCHEMA_TYPES.organization, values)).toBe(true);
    expect(
      isPristine(SCHEMA_TYPES.organization, setField(values, 'name', 'x')),
    ).toBe(false);
  });
});
