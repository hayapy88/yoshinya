import { describe, expect, it } from 'vitest';
import {
  DRAFT_TTL_MS,
  emptyState,
  parseStored,
  reducer,
  SCHEMA_VERSION,
  serialiseDraft,
  type SplitBillState,
} from './state';

const start = () => emptyState('yen');

describe('reducer', () => {
  it('starts with the smallest arrangement that is still a split', () => {
    const state = start();
    expect(state.participants).toHaveLength(2);
    expect(state.expenses).toHaveLength(1);
  });

  it('keeps at least two participants', () => {
    const state = start();
    const after = reducer(state, {
      type: 'remove_participant',
      id: state.participants[0].id,
      withExpenses: false,
    });
    expect(after.participants).toHaveLength(2);
  });

  // The money was really spent. Reassigning it to someone else would put a
  // charge on a person who never agreed to it, so the row is left to be filled.
  it('leaves an expense without a payer rather than reassigning it', () => {
    let state = reducer(start(), { type: 'add_participant' });
    const victim = state.participants[2].id;
    state = reducer(state, {
      type: 'update_expense',
      id: state.expenses[0].id,
      patch: { payerId: victim },
    });
    const after = reducer(state, {
      type: 'remove_participant',
      id: victim,
      withExpenses: false,
    });
    expect(after.expenses[0].payerId).toBe('');
  });

  it('can take the expenses with the participant instead', () => {
    let state = reducer(start(), { type: 'add_participant' });
    state = reducer(state, { type: 'add_expense' });
    const victim = state.participants[2].id;
    state = reducer(state, {
      type: 'update_expense',
      id: state.expenses[0].id,
      patch: { payerId: victim },
    });
    const after = reducer(state, {
      type: 'remove_participant',
      id: victim,
      withExpenses: true,
    });
    expect(after.expenses).toHaveLength(1);
    expect(Object.keys(after.amountInputs)).toHaveLength(1);
  });

  it('keeps what was typed alongside the parsed amount', () => {
    const state = start();
    const after = reducer(state, {
      type: 'set_amount_input',
      id: state.expenses[0].id,
      value: '1,000',
      amountMinor: 1000,
    });
    expect(after.amountInputs[state.expenses[0].id]).toBe('1,000');
    expect(after.expenses[0].amountMinor).toBe(1000);
  });

  it('does not convert amounts when the currency changes', () => {
    let state = start();
    state = reducer(state, {
      type: 'set_amount_input',
      id: state.expenses[0].id,
      value: '1000',
      amountMinor: 1000,
    });
    const after = reducer(state, { type: 'set_currency', currency: 'dollar' });
    expect(after.expenses[0].amountMinor).toBe(1000);
  });

  it('refuses to grow past the limits', () => {
    let state = start();
    for (let i = 0; i < 30; i += 1) {
      state = reducer(state, { type: 'add_participant' });
    }
    expect(state.participants).toHaveLength(20);
  });
});

describe('parseStored', () => {
  const valid = (): SplitBillState => {
    const state = start();
    return {
      ...state,
      participants: state.participants,
      expenses: state.expenses,
    };
  };

  const now = 1_700_000_000_000;

  it('restores a draft it wrote itself', () => {
    expect(parseStored(serialiseDraft(valid(), now), now)).not.toBeNull();
  });

  // The page calls this a temporary save. Without an expiry it was not one.
  it('discards a draft older than its expiry', () => {
    const raw = serialiseDraft(valid(), now);
    expect(parseStored(raw, now + DRAFT_TTL_MS - 1000)).not.toBeNull();
    expect(parseStored(raw, now + DRAFT_TTL_MS + 1000)).toBeNull();
  });

  it('discards a draft with no age recorded, rather than assuming it is fresh', () => {
    expect(parseStored(JSON.stringify({ state: valid() }), now)).toBeNull();
  });

  it('discards a draft from an older shape rather than repairing it', () => {
    const old = { ...valid(), schemaVersion: SCHEMA_VERSION - 1 };
    expect(parseStored(serialiseDraft(old, now), now)).toBeNull();
  });

  it('discards anything that is not the right shape', () => {
    for (const bad of [
      '',
      'null',
      '{}',
      '[]',
      'not json',
      JSON.stringify({ savedAt: now }),
    ]) {
      expect(parseStored(bad, now)).toBeNull();
    }
  });

  it('drops rows that would break the calculation', () => {
    const broken = {
      ...valid(),
      expenses: [
        { id: 'x', payerId: 'a', description: '', amountMinor: 'lots' },
      ],
    };
    expect(
      parseStored(
        serialiseDraft(broken as unknown as SplitBillState, now),
        now,
      ),
    ).toBeNull();
  });
});
