import { describe, expect, it } from 'vitest';
import { SCHEMA_TYPES } from './schemas';
import {
  RETENTION_DAYS,
  defaultState,
  parseStored,
  serializeStored,
} from './storage';
import { emptyValues, setField, setRepeatField } from './values';

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

describe('storage round trip', () => {
  it('restores what was saved', () => {
    const state = defaultState();
    state.selected = 'product';
    state.values.product = setField(state.values.product, 'name', 'Mug');
    state.values.faq = setRepeatField(
      state.values.faq,
      'entries',
      0,
      'question',
      'Q',
    );
    const restored = parseStored(serializeStored(state, NOW), NOW + DAY);
    expect(restored).toEqual(state);
  });

  it('expires after the retention period', () => {
    const state = defaultState();
    state.values.product = setField(state.values.product, 'name', 'Mug');
    const raw = serializeStored(state, NOW);
    expect(parseStored(raw, NOW + (RETENTION_DAYS + 1) * DAY)).toEqual(
      defaultState(),
    );
  });

  it('falls back on garbage, on the wrong shape and on unknown types', () => {
    expect(parseStored('not json', NOW)).toEqual(defaultState());
    expect(parseStored('42', NOW)).toEqual(defaultState());
    expect(
      parseStored(JSON.stringify({ savedAt: NOW, selected: 'recipe' }), NOW)
        .selected,
    ).toBe('article');
  });

  it('drops values of the wrong type and selects outside their options', () => {
    const raw = JSON.stringify({
      savedAt: NOW,
      selected: 'product',
      values: {
        product: { name: 42, priceCurrency: 'XXX', sku: 'A-1' },
        faq: { entries: 'nope' },
      },
    });
    const state = parseStored(raw, NOW);
    expect(state.values.product).toEqual(
      setField(emptyValues(SCHEMA_TYPES.product), 'sku', 'A-1'),
    );
    expect(state.values.faq).toEqual(emptyValues(SCHEMA_TYPES.faq));
  });
});
