import { describe, expect, it } from 'vitest';
import {
  calculateBurdens,
  calculateResults,
  generateSettlements,
  type Expense,
  type Participant,
} from './calculate';

const people = (...weights: number[]): Participant[] =>
  weights.map((weight, i) => ({
    id: String.fromCharCode(65 + i),
    name: String.fromCharCode(65 + i),
    weight,
  }));

const paid = (entries: [string, number][]): Expense[] =>
  entries.map(([payerId, amountMinor], i) => ({
    id: `e${i}`,
    payerId,
    description: '',
    amountMinor,
    shares: null,
  }));

/** An expense only some people share, each at a full share unless told otherwise. */
const sharedPaid = (
  payerId: string,
  amountMinor: number,
  sharers: string[] | Record<string, number>,
): Expense => ({
  id: 'shared',
  payerId,
  description: '',
  amountMinor,
  shares: Array.isArray(sharers)
    ? Object.fromEntries(sharers.map((id) => [id, 1]))
    : sharers,
});

/**
 * The three things that must be true of every result. Asserted on each case
 * rather than only on the worked example, because the failures that matter are
 * the ones nobody thought to write an example for.
 */
function expectConsistent(
  participants: Participant[],
  expenses: Expense[],
): ReturnType<typeof calculateResults> {
  const result = calculateResults(participants, expenses);
  const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

  expect(sum(result.participantResults.map((r) => r.burdenMinor))).toBe(
    result.totalMinor,
  );
  expect(sum(result.participantResults.map((r) => r.paidMinor))).toBe(
    result.totalMinor,
  );
  expect(sum(result.participantResults.map((r) => r.balanceMinor))).toBe(0);

  // Settling should leave nobody owing anything.
  const after = new Map(
    result.participantResults.map((r) => [r.participantId, r.balanceMinor]),
  );
  for (const s of result.settlements) {
    after.set(
      s.fromParticipantId,
      (after.get(s.fromParticipantId) ?? 0) + s.amountMinor,
    );
    after.set(
      s.toParticipantId,
      (after.get(s.toParticipantId) ?? 0) - s.amountMinor,
    );
  }
  for (const [, balance] of after) {
    expect(balance).toBe(0);
  }
  return result;
}

describe('calculateBurdens', () => {
  it('splits evenly when everyone carries the same weight', () => {
    const burdens = calculateBurdens(people(1, 1, 1, 1), 4000);
    expect([...burdens.values()]).toEqual([1000, 1000, 1000, 1000]);
  });

  it('splits by weight', () => {
    const burdens = calculateBurdens(people(1, 1, 1, 0.5, 0.2), 37000);
    expect([...burdens.values()]).toEqual([10000, 10000, 10000, 5000, 2000]);
  });

  it('gives nothing to a weight of zero', () => {
    const burdens = calculateBurdens(people(1, 1, 0), 3000);
    expect(burdens.get('C')).toBe(0);
  });

  // The case a naive round() gets wrong: three ways of 1000 is 333.33 each, and
  // rounding each in isolation loses a yen from the total.
  it('assigns every last unit when the split does not divide', () => {
    const burdens = calculateBurdens(people(1, 1, 1), 1000);
    const values = [...burdens.values()];
    expect(values.reduce((a, b) => a + b, 0)).toBe(1000);
    expect(values.sort()).toEqual([333, 333, 334]);
  });

  it('hands leftovers to the largest remainders first', () => {
    // 100 split 1 : 2 : 2 is 20 / 40 / 40 exactly; 101 leaves one unit, and it
    // belongs to whichever share was cut hardest.
    const burdens = calculateBurdens(people(1, 2, 2), 101);
    expect([...burdens.values()].reduce((a, b) => a + b, 0)).toBe(101);
  });

  it('breaks ties by registration order, so the answer is stable', () => {
    const first = calculateBurdens(people(1, 1, 1), 100);
    const second = calculateBurdens(people(1, 1, 1), 100);
    expect([...first.values()]).toEqual([...second.values()]);
    expect([...first.values()]).toEqual([34, 33, 33]);
  });

  it('gives everyone nothing when every weight is zero', () => {
    const burdens = calculateBurdens(people(0, 0), 5000);
    expect([...burdens.values()]).toEqual([0, 0]);
  });
});

describe('calculateResults', () => {
  it('matches the worked example from the specification', () => {
    const result = expectConsistent(
      people(1, 1, 1, 0.5, 0.2),
      paid([
        ['A', 15000],
        ['B', 12000],
        ['C', 10000],
      ]),
    );
    expect(result.totalMinor).toBe(37000);
    expect(result.participantResults.map((r) => r.balanceMinor)).toEqual([
      5000, 2000, 0, -5000, -2000,
    ]);
    expect(result.settlements).toEqual([
      { fromParticipantId: 'D', toParticipantId: 'A', amountMinor: 5000 },
      { fromParticipantId: 'E', toParticipantId: 'B', amountMinor: 2000 },
    ]);
  });

  it('lets someone who owes nothing still be repaid in full', () => {
    const result = expectConsistent(people(1, 1, 0), paid([['C', 3000]]));
    const c = result.participantResults[2];
    expect(c.burdenMinor).toBe(0);
    expect(c.balanceMinor).toBe(3000);
    expect(result.settlements).toHaveLength(2);
  });

  it('handles one person paying for everyone', () => {
    const result = expectConsistent(people(1, 1, 1, 1), paid([['A', 10000]]));
    expect(result.settlements).toHaveLength(3);
    expect(result.settlements.every((s) => s.toParticipantId === 'A')).toBe(
      true,
    );
  });

  it('needs no settlements when everyone paid their own share', () => {
    const result = expectConsistent(
      people(1, 1),
      paid([
        ['A', 5000],
        ['B', 5000],
      ]),
    );
    expect(result.settlements).toEqual([]);
  });

  it('handles one creditor and several debtors', () => {
    const result = expectConsistent(people(1, 1, 1), paid([['A', 900]]));
    expect(result.settlements).toHaveLength(2);
  });

  it('handles several creditors and one debtor', () => {
    const result = expectConsistent(
      people(1, 1, 1),
      paid([
        ['A', 600],
        ['B', 600],
      ]),
    );
    expect(result.settlements.every((s) => s.fromParticipantId === 'C')).toBe(
      true,
    );
  });

  it('handles several on both sides', () => {
    expectConsistent(
      people(1, 1, 1, 1),
      paid([
        ['A', 5000],
        ['B', 4000],
        ['C', 100],
        ['D', 900],
      ]),
    );
  });

  // A cent of drift here is somebody paying the wrong amount, so the awkward
  // divisions are checked rather than assumed.
  it('stays exact on a cent-level split that does not divide', () => {
    const result = expectConsistent(
      people(1, 1, 1),
      paid([['A', 1000]]), // 10.00 in a decimal currency
    );
    expect(
      result.participantResults.reduce((n, r) => n + r.burdenMinor, 0),
    ).toBe(1000);
  });

  it('stays exact with awkward weights', () => {
    expectConsistent(people(0.3, 0.3, 0.4, 1.7), paid([['A', 99991]]));
  });

  it('handles a large but permitted amount', () => {
    expectConsistent(people(1, 1, 1), paid([['A', 999_999_999]]));
  });

  it('ignores an expense whose payer is gone rather than losing the money', () => {
    const result = calculateResults(
      people(1, 1),
      paid([
        ['A', 1000],
        ['GONE', 500],
      ]),
    );
    // The total still counts it — it was spent — and it simply belongs to
    // nobody, which the balances then reflect.
    expect(result.totalMinor).toBe(1500);
    expect(
      result.participantResults.reduce((n, r) => n + r.burdenMinor, 0),
    ).toBe(1500);
  });

  it('produces nothing to settle when there are no expenses', () => {
    const result = expectConsistent(people(1, 1), []);
    expect(result.totalMinor).toBe(0);
    expect(result.settlements).toEqual([]);
  });
});

describe('generateSettlements', () => {
  it('keeps the number of transfers down', () => {
    // Two people owe exactly what two others are due; four transfers would
    // settle it, two is what a person would actually do.
    const settlements = generateSettlements([
      { participantId: 'A', burdenMinor: 0, paidMinor: 0, balanceMinor: 500 },
      { participantId: 'B', burdenMinor: 0, paidMinor: 0, balanceMinor: 300 },
      { participantId: 'C', burdenMinor: 0, paidMinor: 0, balanceMinor: -500 },
      { participantId: 'D', burdenMinor: 0, paidMinor: 0, balanceMinor: -300 },
    ]);
    expect(settlements).toHaveLength(2);
  });

  it('never records a transfer of nothing', () => {
    const settlements = generateSettlements([
      { participantId: 'A', burdenMinor: 0, paidMinor: 0, balanceMinor: 0 },
      { participantId: 'B', burdenMinor: 0, paidMinor: 0, balanceMinor: 0 },
    ]);
    expect(settlements).toEqual([]);
  });
});

describe('an expense only some people share', () => {
  // The wine case, which is the reason the feature exists: three drink it, two
  // do not, and no arrangement of overall shares expresses that.
  it('charges only the people named on it', () => {
    const result = expectConsistent(people(1, 1, 1, 1, 1), [
      sharedPaid('A', 3000, ['A', 'B', 'C']),
    ]);
    const burdens = result.participantResults.map((r) => r.burdenMinor);
    expect(burdens).toEqual([1000, 1000, 1000, 0, 0]);
  });

  // The picker carries each person's usual share into the override, so a half
  // share stays a half share unless it is changed on purpose.
  it('still applies each person\u2019s share within that group', () => {
    const result = expectConsistent(people(1, 1, 0.5), [
      sharedPaid('A', 2500, { A: 1, B: 1, C: 0.5 }),
    ]);
    expect(result.participantResults.map((r) => r.burdenMinor)).toEqual([
      1000, 1000, 500,
    ]);
  });

  // Each expense has to land exactly, or the totals drift by a unit per row.
  it('keeps every expense exact when it does not divide', () => {
    const result = expectConsistent(people(1, 1, 1, 1), [
      sharedPaid('A', 1000, ['A', 'B', 'C']),
    ]);
    expect(
      result.participantResults.reduce((n, r) => n + r.burdenMinor, 0),
    ).toBe(1000);
  });

  it('mixes shared and whole-group expenses in one event', () => {
    const result = expectConsistent(people(1, 1, 1, 1), [
      {
        id: 'wine',
        payerId: 'A',
        description: '',
        amountMinor: 3000,
        shares: { A: 1, B: 1, C: 1 },
      },
      {
        id: 'taxi',
        payerId: 'D',
        description: '',
        amountMinor: 4000,
        shares: null,
      },
    ]);
    // 1000 each on the wine for three, 1000 each on the taxi for four.
    expect(result.participantResults.map((r) => r.burdenMinor)).toEqual([
      2000, 2000, 2000, 1000,
    ]);
  });

  it('leaves out a named person who carries no share at all', () => {
    const result = expectConsistent(people(1, 1, 0), [
      sharedPaid('A', 2000, { A: 1, B: 1, C: 0 }),
    ]);
    expect(result.participantResults[2].burdenMinor).toBe(0);
  });

  it('treats naming everyone the same as naming nobody in particular', () => {
    const all = calculateResults(people(1, 1, 1), [
      sharedPaid('A', 1000, ['A', 'B', 'C']),
    ]);
    const none = calculateResults(people(1, 1, 1), paid([['A', 1000]]));
    expect(all.participantResults).toEqual(none.participantResults);
  });
});

describe('a share set for one expense only', () => {
  // The case a general share cannot express: one glass of the wine, but a
  // normal amount of everything else.
  it('weighs a person differently on different costs', () => {
    const result = expectConsistent(people(1, 1, 1), [
      {
        id: 'wine',
        payerId: 'A',
        description: '',
        amountMinor: 2500,
        shares: { A: 1, B: 1, C: 0.5 },
      },
      {
        id: 'food',
        payerId: 'B',
        description: '',
        amountMinor: 3000,
        shares: null,
      },
    ]);
    // Wine 2500 over 2.5 shares: 1000 / 1000 / 500. Food 3000 split three ways.
    expect(result.participantResults.map((r) => r.burdenMinor)).toEqual([
      2000, 2000, 1500,
    ]);
  });

  it('leaves out anyone given a share of zero for that cost', () => {
    const result = expectConsistent(people(1, 1, 1), [
      {
        id: 'wine',
        payerId: 'A',
        description: '',
        amountMinor: 1000,
        shares: { A: 1, B: 1, C: 0 },
      },
    ]);
    expect(result.participantResults[2].burdenMinor).toBe(0);
  });

  // The override is the whole story for that expense, so a later change to
  // someone's general share must not quietly reach back into it.
  it('ignores the general share once one is set for the expense', () => {
    const withOverride = calculateResults(people(1, 1, 0.2), [
      sharedPaid('A', 1000, { A: 1, B: 1, C: 1 }),
    ]);
    expect(withOverride.participantResults.map((r) => r.burdenMinor)).toEqual([
      334, 333, 333,
    ]);
  });

  it('drops a person who has since been removed from the event', () => {
    const result = calculateResults(people(1, 1), [
      sharedPaid('A', 900, { A: 1, B: 1, GONE: 1 }),
    ]);
    expect(result.participantResults.map((r) => r.burdenMinor)).toEqual([
      450, 450,
    ]);
  });
});
