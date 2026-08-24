import { describe, expect, it } from 'vitest';
import { calculateResults } from './calculate';
import {
  breakDownExpenses,
  groupByPayer,
  narrateSettlements,
  netBetweenPairs,
  netPositions,
  statementFor,
} from './explain';

const p = (id: string) => ({ id, name: id, weight: 1 });
const people = [p('a'), p('b'), p('c')];

// The reported case: a buys wine that only a and c drink, b buys the food.
const expenses = [
  {
    id: 'w',
    payerId: 'a',
    description: 'wine',
    amountMinor: 3000,
    shares: { a: 1, c: 1 },
  },
  {
    id: 'ch',
    payerId: 'b',
    description: 'cheese',
    amountMinor: 600,
    shares: null,
  },
  {
    id: 'sa',
    payerId: 'b',
    description: 'salami',
    amountMinor: 900,
    shares: null,
  },
];

describe('breakDownExpenses', () => {
  it('shows each sharer’s portion of a cost', () => {
    const [wine] = breakDownExpenses(expenses, people);
    expect(wine.shares).toEqual([
      { participantId: 'a', weight: 1, amountMinor: 1500 },
      { participantId: 'c', weight: 1, amountMinor: 1500 },
    ]);
  });

  // The payer's own portion is not a debt — they already paid it.
  it('leaves the payer owing nothing on their own expense', () => {
    const [wine] = breakDownExpenses(expenses, people);
    expect(wine.debts).toEqual([
      { fromParticipantId: 'c', toParticipantId: 'a', amountMinor: 1500 },
    ]);
  });

  it('has every sharer but the payer owing on a whole-group cost', () => {
    const [, cheese] = breakDownExpenses(expenses, people);
    expect(cheese.debts).toEqual([
      { fromParticipantId: 'a', toParticipantId: 'b', amountMinor: 200 },
      { fromParticipantId: 'c', toParticipantId: 'b', amountMinor: 200 },
    ]);
  });
});

describe('netBetweenPairs', () => {
  it('produces the debts people expect to see', () => {
    const debts = netBetweenPairs(breakDownExpenses(expenses, people));
    // The three debts a person would write on a napkin — including the one
    // that explains the whole thing: the wine payer owes for the food.
    expect(debts).toEqual([
      { fromParticipantId: 'c', toParticipantId: 'a', amountMinor: 1500 },
      { fromParticipantId: 'a', toParticipantId: 'b', amountMinor: 500 },
      { fromParticipantId: 'c', toParticipantId: 'b', amountMinor: 500 },
    ]);
  });

  // The whole point: these must describe the same positions the settlement
  // does, or the explanation would be explaining something else.
  it('leaves everyone where the balances say they are', () => {
    const debts = netBetweenPairs(breakDownExpenses(expenses, people));
    const net = new Map<string, number>(people.map((x) => [x.id, 0]));
    for (const debt of debts) {
      net.set(
        debt.fromParticipantId,
        (net.get(debt.fromParticipantId) ?? 0) - debt.amountMinor,
      );
      net.set(
        debt.toParticipantId,
        (net.get(debt.toParticipantId) ?? 0) + debt.amountMinor,
      );
    }
    for (const r of calculateResults(people, expenses).participantResults) {
      expect(net.get(r.participantId)).toBe(r.balanceMinor);
    }
  });

  it('cancels debts that run both ways between the same two people', () => {
    const debts = netBetweenPairs(
      breakDownExpenses(
        [
          {
            id: '1',
            payerId: 'a',
            description: '',
            amountMinor: 1000,
            shares: { a: 1, b: 1 },
          },
          {
            id: '2',
            payerId: 'b',
            description: '',
            amountMinor: 800,
            shares: { a: 1, b: 1 },
          },
        ],
        people,
      ),
    );
    // b owes a 500, a owes b 400: one payment of 100 settles it.
    expect(debts).toEqual([
      { fromParticipantId: 'b', toParticipantId: 'a', amountMinor: 100 },
    ]);
  });

  it('says nothing when everyone already paid their own way', () => {
    expect(
      netBetweenPairs(
        breakDownExpenses(
          [
            {
              id: '1',
              payerId: 'a',
              description: '',
              amountMinor: 500,
              shares: { a: 1 },
            },
            {
              id: '2',
              payerId: 'b',
              description: '',
              amountMinor: 500,
              shares: { b: 1 },
            },
          ],
          people,
        ),
      ),
    ).toEqual([]);
  });
});

describe('groupByPayer', () => {
  it('collects every debt a person owes under one heading', () => {
    const grouped = groupByPayer([
      { fromParticipantId: 'c', toParticipantId: 'a', amountMinor: 600 },
      { fromParticipantId: 'c', toParticipantId: 'b', amountMinor: 400 },
      { fromParticipantId: 'a', toParticipantId: 'b', amountMinor: 200 },
    ]);
    expect(grouped).toEqual([
      {
        fromParticipantId: 'c',
        totalMinor: 1000,
        debts: [
          { fromParticipantId: 'c', toParticipantId: 'a', amountMinor: 600 },
          { fromParticipantId: 'c', toParticipantId: 'b', amountMinor: 400 },
        ],
      },
      {
        fromParticipantId: 'a',
        totalMinor: 200,
        debts: [
          { fromParticipantId: 'a', toParticipantId: 'b', amountMinor: 200 },
        ],
      },
    ]);
  });
});

describe('netPositions', () => {
  // The bridge to the final transfers. Gross totals do not survive the netting
  // — someone can owe in one direction and be owed more in another — but this
  // does, and it is what the settlement is built from.
  it('lands on the same balance the calculation does', () => {
    const positions = netPositions(
      netBetweenPairs(breakDownExpenses(expenses, people)),
      people,
    );
    const balances = new Map(
      calculateResults(people, expenses).participantResults.map((r) => [
        r.participantId,
        r.balanceMinor,
      ]),
    );
    for (const position of positions) {
      expect(position.netMinor).toBe(balances.get(position.participantId));
    }
  });

  it('shows both directions for someone who owes and is owed', () => {
    const positions = netPositions(
      netBetweenPairs(breakDownExpenses(expenses, people)),
      people,
    );
    const a = positions.find((p) => p.participantId === 'a');
    expect(a).toEqual({
      participantId: 'a',
      paysMinor: 500,
      receivesMinor: 1500,
      netMinor: 1000,
    });
  });

  it('leaves out anyone with nothing either way', () => {
    expect(netPositions([], people)).toEqual([]);
  });
});

describe('narrateSettlements', () => {
  // The narration and the real calculation must not drift apart, or the page
  // would be explaining a settlement the tool does not produce.
  it('describes exactly the transfers the tool makes', () => {
    const positions = netPositions(
      netBetweenPairs(breakDownExpenses(expenses, people)),
      people,
    );
    const narrated = narrateSettlements(positions).map((step) => ({
      fromParticipantId: step.fromParticipantId,
      toParticipantId: step.toParticipantId,
      amountMinor: step.amountMinor,
    }));
    expect(narrated).toEqual(calculateResults(people, expenses).settlements);
  });

  it('carries a running remainder, so each line follows from the last', () => {
    const steps = narrateSettlements([
      { participantId: 'x', paysMinor: 0, receivesMinor: 0, netMinor: -1200 },
      { participantId: 'y', paysMinor: 0, receivesMinor: 0, netMinor: -600 },
      { participantId: 'z', paysMinor: 0, receivesMinor: 0, netMinor: 1800 },
    ]);
    expect(steps).toEqual([
      {
        fromParticipantId: 'x',
        toParticipantId: 'z',
        amountMinor: 1200,
        fromOwedMinor: 1200,
        toOwedMinor: 1800,
        fromRemainingMinor: 0,
        toRemainingMinor: 600,
      },
      {
        fromParticipantId: 'y',
        toParticipantId: 'z',
        amountMinor: 600,
        fromOwedMinor: 600,
        toOwedMinor: 600,
        fromRemainingMinor: 0,
        toRemainingMinor: 0,
      },
    ]);
  });

  it('says nothing when nobody owes anybody', () => {
    expect(narrateSettlements([])).toEqual([]);
  });
});

describe('statementFor', () => {
  // The question this answers: "I did not drink the wine — is it in what you
  // are asking me for?" A list that omits the wine makes them notice an
  // absence; this says it outright.
  it('lists costs the person carries nothing of, rather than omitting them', () => {
    const statement = statementFor(breakDownExpenses(expenses, people), 'b');
    const wine = statement.find((item) => item.expense.description === 'wine');
    expect(wine?.amountMinor).toBeNull();
  });

  it('gives their portion of everything they do carry', () => {
    const statement = statementFor(breakDownExpenses(expenses, people), 'c');
    expect(
      statement.map((item) => [item.expense.description, item.amountMinor]),
    ).toEqual([
      ['wine', 1500],
      ['cheese', 200],
      ['salami', 300],
    ]);
  });

  it('adds up to the burden the calculation gives them', () => {
    for (const participant of people) {
      const statement = statementFor(
        breakDownExpenses(expenses, people),
        participant.id,
      );
      const total = statement.reduce(
        (sum, item) => sum + (item.amountMinor ?? 0),
        0,
      );
      const burden = calculateResults(people, expenses).participantResults.find(
        (r) => r.participantId === participant.id,
      )?.burdenMinor;
      expect(total).toBe(burden);
    }
  });

  it('says how many people share each cost', () => {
    const statement = statementFor(breakDownExpenses(expenses, people), 'a');
    expect(statement.map((item) => item.sharerCount)).toEqual([2, 3, 3]);
  });
});

describe('a statement when the weights differ', () => {
  const weighted = [
    {
      id: 'wineB',
      payerId: 'a',
      description: 'ワインB',
      amountMinor: 3000,
      shares: { a: 0.5, b: 1, c: 1 },
    },
  ];

  // The weight was set on the form and then appeared nowhere in the result, so
  // there was no way to check that A really was down for half.
  it('reports the weight the person carries', () => {
    const [item] = statementFor(breakDownExpenses(weighted, people), 'a');
    expect(item.weight).toBe(0.5);
    expect(item.totalWeight).toBe(2.5);
    expect(item.amountMinor).toBe(600);
  });

  // "Split 3 ways" reads as equal thirds, which is wrong here.
  it('knows the cost is not shared evenly', () => {
    const [item] = statementFor(breakDownExpenses(weighted, people), 'a');
    expect(item.evenlyShared).toBe(false);
  });

  it('still calls an equal split even', () => {
    const [item] = statementFor(breakDownExpenses(expenses, people), 'a');
    expect(item.evenlyShared).toBe(true);
  });

  it('has no weight for someone who carries none of it', () => {
    const [item] = statementFor(breakDownExpenses(expenses, people), 'b');
    expect(item.weight).toBeNull();
  });
});
