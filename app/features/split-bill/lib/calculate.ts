// The arithmetic of the tool, kept apart from the screen so it can be checked
// exhaustively. Everything here is a pure function over integers.
//
// Three properties must hold for every input, and the tests assert them
// directly rather than only checking worked examples:
//
//   Σ burden  = total          nobody is asked to cover more or less than was spent
//   Σ balance = 0              what is owed equals what is owed to
//   after settling, every balance is 0

export type Participant = {
  id: string;
  name: string;
  /** Relative share. 1 is a normal share, 0.5 half, 0 none. */
  weight: number;
};

export type Expense = {
  id: string;
  payerId: string;
  description: string;
  amountMinor: number;
  /**
   * Who shares this particular cost, and how much of it each carries.
   *
   * `null` means everyone at the share they carry generally — the usual case,
   * and the one that stays out of the way. Once set, it is the whole story for
   * this expense: only the people listed share it, at the weights listed.
   *
   * A person's general share cannot express "drank one glass of the wine but
   * ate a normal amount of the food", because it applies to everything at once.
   * This can.
   */
  shares: Record<string, number> | null;
};

export type ParticipantResult = {
  participantId: string;
  burdenMinor: number;
  paidMinor: number;
  balanceMinor: number;
};

export type Settlement = {
  fromParticipantId: string;
  toParticipantId: string;
  amountMinor: number;
};

export type CalculationResult = {
  totalMinor: number;
  participantResults: ParticipantResult[];
  settlements: Settlement[];
};

export function totalOf(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amountMinor, 0);
}

/**
 * Splits the total by weight, to the exact minor unit.
 *
 * Rounding each share independently leaves the sum a unit or two away from the
 * total, which shows up as a table that visibly does not add up. The largest
 * remainder method takes the floor of every share and hands the leftover units
 * to whoever was cut by the most, so the column always sums to the total.
 *
 * Ties go to registration order — arbitrary, but it has to be decided by
 * something, and being deterministic is what stops the same input producing
 * two different answers.
 */
export function calculateBurdens(
  participants: Share[],
  totalMinor: number,
): Map<string, number> {
  const burdens = new Map<string, number>();
  const weightSum = participants.reduce((sum, p) => sum + p.weight, 0);

  if (weightSum <= 0 || totalMinor <= 0) {
    for (const participant of participants) {
      burdens.set(participant.id, 0);
    }
    return burdens;
  }

  const shares = participants.map((participant, index) => {
    const exact = (totalMinor * participant.weight) / weightSum;
    const floor = Math.floor(exact);
    return { id: participant.id, index, floor, remainder: exact - floor };
  });

  let assigned = 0;
  for (const share of shares) {
    burdens.set(share.id, share.floor);
    assigned += share.floor;
  }

  const leftover = totalMinor - assigned;
  const byRemainder = [...shares].sort(
    (a, b) => b.remainder - a.remainder || a.index - b.index,
  );
  for (let i = 0; i < leftover; i += 1) {
    const share = byRemainder[i % byRemainder.length];
    burdens.set(share.id, (burdens.get(share.id) ?? 0) + 1);
  }

  return burdens;
}

/** A person's stake in one expense. */
export type Share = { id: string; weight: number };

/**
 * Who carries a given cost and by how much.
 *
 * Filtered against the current participants, so a person removed after an
 * expense was set up stops sharing it rather than lingering as an id nobody
 * can see.
 */
export function sharesOf(
  expense: Expense,
  participants: Participant[],
): Share[] {
  const overrides = expense.shares;
  return participants
    .map((participant) => ({
      id: participant.id,
      weight:
        overrides === null
          ? participant.weight
          : (overrides[participant.id] ?? 0),
    }))
    .filter((share) => share.weight > 0);
}

export function calculateResults(
  participants: Participant[],
  expenses: Expense[],
): CalculationResult {
  const totalMinor = totalOf(expenses);

  // Allocated per expense rather than once over the total. Splitting the grand
  // total would let one person's exclusion from the wine quietly change what
  // everyone owes on the taxi, and each expense rounding to its own exact
  // amount is what keeps the column adding up.
  const burdens = new Map<string, number>(participants.map((p) => [p.id, 0]));
  for (const expense of expenses) {
    const sharers = sharesOf(expense, participants);
    const share = calculateBurdens(sharers, expense.amountMinor);
    for (const [id, amount] of share) {
      burdens.set(id, (burdens.get(id) ?? 0) + amount);
    }
  }

  const paid = new Map<string, number>();
  for (const participant of participants) {
    paid.set(participant.id, 0);
  }
  for (const expense of expenses) {
    // An expense whose payer has been removed would otherwise vanish from the
    // paid column while still counting towards the total.
    if (paid.has(expense.payerId)) {
      paid.set(
        expense.payerId,
        (paid.get(expense.payerId) ?? 0) + expense.amountMinor,
      );
    }
  }

  const participantResults = participants.map((participant) => {
    const burdenMinor = burdens.get(participant.id) ?? 0;
    const paidMinor = paid.get(participant.id) ?? 0;
    return {
      participantId: participant.id,
      burdenMinor,
      paidMinor,
      balanceMinor: paidMinor - burdenMinor,
    };
  });

  return {
    totalMinor,
    participantResults,
    settlements: generateSettlements(participantResults),
  };
}

/**
 * Who pays whom.
 *
 * Largest debt against largest credit, repeatedly. This keeps the number of
 * transfers low — which is the thing people actually care about, since each one
 * is a separate errand — without claiming to be the mathematical minimum, which
 * would need a much more expensive search and is not what the tool promises.
 */
export function generateSettlements(
  results: ParticipantResult[],
): Settlement[] {
  const creditors = results
    .filter((r) => r.balanceMinor > 0)
    .map((r) => ({ id: r.participantId, remaining: r.balanceMinor }))
    .sort((a, b) => b.remaining - a.remaining);
  const debtors = results
    .filter((r) => r.balanceMinor < 0)
    .map((r) => ({ id: r.participantId, remaining: -r.balanceMinor }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlements: Settlement[] = [];
  let c = 0;
  let d = 0;
  while (c < creditors.length && d < debtors.length) {
    const amount = Math.min(creditors[c].remaining, debtors[d].remaining);
    if (amount > 0) {
      settlements.push({
        fromParticipantId: debtors[d].id,
        toParticipantId: creditors[c].id,
        amountMinor: amount,
      });
    }
    creditors[c].remaining -= amount;
    debtors[d].remaining -= amount;
    if (creditors[c].remaining === 0) c += 1;
    if (debtors[d].remaining === 0) d += 1;
  }
  return settlements;
}
