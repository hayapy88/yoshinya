import {
  calculateBurdens,
  sharesOf,
  type Expense,
  type Participant,
} from './calculate';

// Why the final transfers are what they are.
//
// The settlement list is correct but unreadable: someone who paid 3,000 for
// wine they also drank is owed 1,000, not 1,500, and no amount of staring at
// the total explains the difference. These functions rebuild the two steps
// between the receipts and the answer, so the arithmetic can be followed
// rather than trusted.

export type Debt = {
  fromParticipantId: string;
  toParticipantId: string;
  amountMinor: number;
};

export type ExpenseBreakdown = {
  expense: Expense;
  /** What each sharer's portion of this expense came to, and at what weight. */
  shares: { participantId: string; weight: number; amountMinor: number }[];
  /** What that leaves them owing the person who paid. */
  debts: Debt[];
};

/**
 * Step one: each expense on its own.
 *
 * Everyone who shares a cost owes their portion to whoever paid it — except
 * the payer, whose own portion is already covered by having paid.
 */
export function breakDownExpenses(
  expenses: Expense[],
  participants: Participant[],
): ExpenseBreakdown[] {
  return expenses.map((expense) => {
    const sharers = sharesOf(expense, participants);
    const burdens = calculateBurdens(sharers, expense.amountMinor);
    const shares = sharers.map((sharer) => ({
      participantId: sharer.id,
      weight: sharer.weight,
      amountMinor: burdens.get(sharer.id) ?? 0,
    }));
    return {
      expense,
      shares,
      debts: shares
        .filter(
          (share) =>
            share.participantId !== expense.payerId && share.amountMinor > 0,
        )
        .map((share) => ({
          fromParticipantId: share.participantId,
          toParticipantId: expense.payerId,
          amountMinor: share.amountMinor,
        })),
    };
  });
}

/**
 * Step two: everything owed between the same two people, added up and cancelled
 * against what is owed back.
 *
 * This is the picture most people carry in their head — "I owe you, you owe me,
 * so really I owe you this much" — and it is where the wine payer's 1,500 turns
 * into 1,000, because they owe 500 for the food somebody else bought.
 */
export function netBetweenPairs(breakdowns: ExpenseBreakdown[]): Debt[] {
  const pairs = new Map<string, number>();
  for (const breakdown of breakdowns) {
    for (const debt of breakdown.debts) {
      // One key per unordered pair, with the sign carrying the direction.
      const [first, second] = [debt.fromParticipantId, debt.toParticipantId];
      const forward = first < second;
      const key = forward ? `${first}|${second}` : `${second}|${first}`;
      const signed = forward ? debt.amountMinor : -debt.amountMinor;
      pairs.set(key, (pairs.get(key) ?? 0) + signed);
    }
  }

  const debts: Debt[] = [];
  for (const [key, amount] of pairs) {
    if (amount === 0) {
      continue;
    }
    const [first, second] = key.split('|');
    debts.push(
      amount > 0
        ? {
            fromParticipantId: first,
            toParticipantId: second,
            amountMinor: amount,
          }
        : {
            fromParticipantId: second,
            toParticipantId: first,
            amountMinor: -amount,
          },
    );
  }
  return debts.sort((a, b) => b.amountMinor - a.amountMinor);
}

export type NetPosition = {
  participantId: string;
  paysMinor: number;
  receivesMinor: number;
  /** Positive when they end up receiving, negative when they end up paying. */
  netMinor: number;
};

/**
 * Each person's total in and out, and what that leaves.
 *
 * This is the bridge to the final transfers, and the only honest one. It is
 * tempting to say a person's payments in the pairwise list simply become their
 * payments in the settlement, and that is false: someone can owe 500 in one
 * direction while being owed 1,500 in another, and end up receiving. Only the
 * net survives, which is exactly what the settlement is built from.
 */
export function netPositions(
  debts: Debt[],
  participants: Participant[],
): NetPosition[] {
  return participants
    .map((participant) => {
      const paysMinor = debts
        .filter((d) => d.fromParticipantId === participant.id)
        .reduce((sum, d) => sum + d.amountMinor, 0);
      const receivesMinor = debts
        .filter((d) => d.toParticipantId === participant.id)
        .reduce((sum, d) => sum + d.amountMinor, 0);
      return {
        participantId: participant.id,
        paysMinor,
        receivesMinor,
        netMinor: receivesMinor - paysMinor,
      };
    })
    .filter((p) => p.paysMinor > 0 || p.receivesMinor > 0);
}

export type DebtGroup = {
  fromParticipantId: string;
  totalMinor: number;
  debts: Debt[];
};

/** The same debts, gathered under whoever is paying them. */
export function groupByPayer(debts: Debt[]): DebtGroup[] {
  const groups = new Map<string, Debt[]>();
  for (const debt of debts) {
    const existing = groups.get(debt.fromParticipantId);
    if (existing) {
      existing.push(debt);
    } else {
      groups.set(debt.fromParticipantId, [debt]);
    }
  }
  return [...groups.entries()]
    .map(([fromParticipantId, own]) => ({
      fromParticipantId,
      totalMinor: own.reduce((sum, debt) => sum + debt.amountMinor, 0),
      debts: own,
    }))
    .sort((a, b) => b.totalMinor - a.totalMinor);
}

export type SettlementStep = {
  fromParticipantId: string;
  toParticipantId: string;
  amountMinor: number;
  /** What each side still had outstanding before this payment. */
  fromOwedMinor: number;
  toOwedMinor: number;
  /** And after it, so the next line follows from this one. */
  fromRemainingMinor: number;
  toRemainingMinor: number;
};

/**
 * The final transfers, narrated.
 *
 * Which pairwise debt "became" which transfer is not a question with an answer
 * — netting throws that away. What can be shown is how the transfers are built:
 * the largest amount owed is set against the largest amount due, again and
 * again, until nothing is outstanding. Every line follows from the one above,
 * starting from the net positions.
 *
 * Mirrors generateSettlements deliberately. If the two ever disagree the
 * explanation would be describing a calculation the tool does not perform,
 * which a test pins.
 */
export function narrateSettlements(positions: NetPosition[]): SettlementStep[] {
  const creditors = positions
    .filter((p) => p.netMinor > 0)
    .map((p) => ({ id: p.participantId, remaining: p.netMinor }))
    .sort((a, b) => b.remaining - a.remaining);
  const debtors = positions
    .filter((p) => p.netMinor < 0)
    .map((p) => ({ id: p.participantId, remaining: -p.netMinor }))
    .sort((a, b) => b.remaining - a.remaining);

  const steps: SettlementStep[] = [];
  let c = 0;
  let d = 0;
  while (c < creditors.length && d < debtors.length) {
    const amount = Math.min(creditors[c].remaining, debtors[d].remaining);
    if (amount > 0) {
      steps.push({
        fromParticipantId: debtors[d].id,
        toParticipantId: creditors[c].id,
        amountMinor: amount,
        fromOwedMinor: debtors[d].remaining,
        toOwedMinor: creditors[c].remaining,
        fromRemainingMinor: debtors[d].remaining - amount,
        toRemainingMinor: creditors[c].remaining - amount,
      });
    }
    creditors[c].remaining -= amount;
    debtors[d].remaining -= amount;
    if (creditors[c].remaining === 0) c += 1;
    if (debtors[d].remaining === 0) d += 1;
  }
  return steps;
}

export type PersonalItem = {
  expense: Expense;
  /** Their portion, or null when they carry none of this one. */
  amountMinor: number | null;
  /** How many people carry it, so a portion can be checked against the total. */
  sharerCount: number;
  /** Their weight on this cost, and the weights of everyone sharing it. */
  weight: number | null;
  totalWeight: number;
  /**
   * Whether everyone sharing it carries the same weight.
   *
   * When they do, "split 3 ways" says everything. When they do not, it is
   * actively misleading — it reads as equal thirds — and the weights have to
   * be shown instead.
   */
  evenlyShared: boolean;
};

/**
 * One person's statement: every expense, and what they carry of it.
 *
 * Costs they carry nothing of are listed too, marked as such. Someone asked to
 * hand over a sum wants to check that the wine they did not drink is not in it,
 * and a list that simply omits the wine asks them to notice an absence. Saying
 * "wine — you carry none of this" answers the question outright.
 */
export function statementFor(
  breakdowns: ExpenseBreakdown[],
  participantId: string,
): PersonalItem[] {
  return breakdowns.map((breakdown) => {
    const share = breakdown.shares.find(
      (candidate) => candidate.participantId === participantId,
    );
    const totalWeight = breakdown.shares.reduce(
      (sum, candidate) => sum + candidate.weight,
      0,
    );
    return {
      expense: breakdown.expense,
      amountMinor: share ? share.amountMinor : null,
      sharerCount: breakdown.shares.length,
      weight: share ? share.weight : null,
      totalWeight,
      evenlyShared: breakdown.shares.every(
        (candidate) => candidate.weight === breakdown.shares[0]?.weight,
      ),
    };
  });
}
