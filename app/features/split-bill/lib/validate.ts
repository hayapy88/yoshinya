import type { CurrencyCode } from './money';
import { parseAmountToMinor } from './money';
import { sharesOf, type Expense, type Participant } from './calculate';

export const LIMITS = {
  maxParticipants: 20,
  maxExpenses: 100,
  maxNameLength: 30,
  minParticipants: 2,
  maxWeight: 10,
} as const;

export type ProblemCode =
  | 'name_required'
  | 'name_duplicate'
  | 'name_too_long'
  | 'weight_invalid'
  | 'all_weights_zero'
  | 'payer_required'
  | 'amount_invalid'
  | 'no_sharers'
  | 'no_expenses'
  | 'too_few_participants';

/** A problem, tied to the row it belongs to so the message can sit beside it. */
export type Problem = {
  code: ProblemCode;
  participantId?: string;
  expenseId?: string;
};

/**
 * Everything wrong with the current input.
 *
 * Returns every problem rather than the first, because the form shows them all
 * at once — stopping at the first would make fixing five rows take five
 * attempts.
 */
export function validate(
  participants: Participant[],
  expenses: Expense[],
  currency: CurrencyCode,
  rawAmounts: Map<string, string>,
): Problem[] {
  const problems: Problem[] = [];

  const named = participants.map((p) => p.name.trim());
  participants.forEach((participant, index) => {
    const name = named[index];
    if (name === '') {
      problems.push({ code: 'name_required', participantId: participant.id });
    } else if (name.length > LIMITS.maxNameLength) {
      problems.push({ code: 'name_too_long', participantId: participant.id });
    } else if (named.indexOf(name) !== index) {
      problems.push({ code: 'name_duplicate', participantId: participant.id });
    }
    if (
      !Number.isFinite(participant.weight) ||
      participant.weight < 0 ||
      participant.weight > LIMITS.maxWeight
    ) {
      problems.push({ code: 'weight_invalid', participantId: participant.id });
    }
  });

  if (participants.length < LIMITS.minParticipants) {
    problems.push({ code: 'too_few_participants' });
  }

  if (participants.length > 0 && participants.every((p) => !(p.weight > 0))) {
    problems.push({ code: 'all_weights_zero' });
  }

  const ids = new Set(participants.map((p) => p.id));
  expenses.forEach((expense) => {
    if (!expense.payerId || !ids.has(expense.payerId)) {
      problems.push({ code: 'payer_required', expenseId: expense.id });
    }
    // Checked from what was typed, not from the stored number: a field holding
    // "1e5" parses to nothing and must be reported, not silently treated as the
    // last good value.
    const raw = rawAmounts.get(expense.id) ?? '';
    if (parseAmountToMinor(raw, currency) === null) {
      problems.push({ code: 'amount_invalid', expenseId: expense.id });
    }
    // Nobody left to carry it: the cost would vanish from the split while
    // still counting towards the total, and the table would stop adding up.
    if (sharesOf(expense, participants).length === 0) {
      problems.push({ code: 'no_sharers', expenseId: expense.id });
    }
  });

  if (expenses.length === 0) {
    problems.push({ code: 'no_expenses' });
  }

  return problems;
}

export const hasProblem = (problems: Problem[], code: ProblemCode) =>
  problems.some((p) => p.code === code);

export const problemsFor = (
  problems: Problem[],
  key: { participantId?: string; expenseId?: string },
) =>
  problems.filter(
    (p) =>
      (key.participantId !== undefined &&
        p.participantId === key.participantId) ||
      (key.expenseId !== undefined && p.expenseId === key.expenseId),
  );
