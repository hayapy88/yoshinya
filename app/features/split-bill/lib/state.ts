import type { Expense, Participant } from './calculate';
import type { CurrencyCode } from './money';
import { LIMITS } from './validate';

/**
 * Bumped whenever the shape below changes. Restoring last week's data into
 * this week's fields is how a saved draft turns into a crash, so anything that
 * does not match is discarded rather than repaired.
 */
export const SCHEMA_VERSION = 3;

export const STORAGE_KEY = 'yoshinya.split-bill.v1';

/**
 * How long a draft survives.
 *
 * The page calls this a temporary save, and without an expiry that was simply
 * untrue — a party's names and amounts would sit on the device indefinitely.
 * A split is settled within days of the event; a month is generous without
 * being forever.
 */
export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SplitBillState = {
  schemaVersion: number;
  eventName: string;
  eventDate: string;
  currency: CurrencyCode;
  participants: Participant[];
  expenses: Expense[];
  /** What was typed in each amount field, kept so editing does not reformat. */
  amountInputs: Record<string, string>;
};

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/**
 * Fixed ids for the rows that exist before anyone has typed anything.
 *
 * These are produced during render, and the page is server-rendered, so a
 * random id here is generated once on the server and again in the browser —
 * two different values for the same row. Hydration then leaves a tree holding
 * both: the payer dropdown listed the server's ids while the name fields
 * carried the browser's, so choosing a payer stored an id that matched nobody
 * and the form insisted a payer had not been chosen.
 *
 * Rows added later are created by a click, which only ever happens in the
 * browser, so those keep random ids.
 */
const INITIAL_IDS = {
  participants: ['p-initial-1', 'p-initial-2'],
  expense: 'e-initial-1',
} as const;

export function emptyState(currency: CurrencyCode): SplitBillState {
  return {
    schemaVersion: SCHEMA_VERSION,
    eventName: '',
    eventDate: '',
    currency,
    // Two people and one expense: the smallest arrangement that is still a
    // split, so the first thing on screen is already the shape of the answer.
    participants: INITIAL_IDS.participants.map((id) => ({
      id,
      name: '',
      weight: 1,
    })),
    expenses: [
      {
        id: INITIAL_IDS.expense,
        payerId: '',
        description: '',
        amountMinor: 0,
        shares: null,
      },
    ],
    amountInputs: { [INITIAL_IDS.expense]: '' },
  };
}

export type Action =
  | {
      type: 'set_event';
      patch: Partial<Pick<SplitBillState, 'eventName' | 'eventDate'>>;
    }
  | { type: 'set_currency'; currency: CurrencyCode }
  | { type: 'add_participant' }
  | { type: 'update_participant'; id: string; patch: Partial<Participant> }
  | { type: 'remove_participant'; id: string; withExpenses: boolean }
  | { type: 'add_expense' }
  | { type: 'update_expense'; id: string; patch: Partial<Expense> }
  | { type: 'set_amount_input'; id: string; value: string; amountMinor: number }
  | { type: 'remove_expense'; id: string }
  | { type: 'reset'; currency: CurrencyCode }
  | { type: 'restore'; state: SplitBillState };

export function reducer(state: SplitBillState, action: Action): SplitBillState {
  switch (action.type) {
    case 'set_event':
      return { ...state, ...action.patch };

    case 'set_currency':
      // Amounts are not converted — the numbers stay, only the symbol and the
      // number of decimals change. Converting would invent an exchange rate.
      return { ...state, currency: action.currency };

    case 'add_participant':
      if (state.participants.length >= LIMITS.maxParticipants) {
        return state;
      }
      return {
        ...state,
        participants: [
          ...state.participants,
          { id: newId(), name: '', weight: 1 },
        ],
      };

    case 'update_participant':
      return {
        ...state,
        participants: state.participants.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p,
        ),
      };

    case 'remove_participant': {
      if (state.participants.length <= LIMITS.minParticipants) {
        return state;
      }
      const expenses = action.withExpenses
        ? state.expenses.filter((e) => e.payerId !== action.id)
        : state.expenses.map((e) =>
            // Left without a payer rather than silently reassigned: the amount
            // was really spent, and who owes it is the user's call.
            e.payerId === action.id ? { ...e, payerId: '' } : e,
          );
      // A departed participant must also stop sharing costs, or they keep
      // taking a slice of every expense that still names them.
      const withoutSharer = expenses.map((e) => {
        if (e.shares === null || !(action.id in e.shares)) {
          return e;
        }
        const { [action.id]: _gone, ...rest } = e.shares;
        return { ...e, shares: rest };
      });
      return {
        ...state,
        participants: state.participants.filter((p) => p.id !== action.id),
        expenses: withoutSharer,
        amountInputs: Object.fromEntries(
          Object.entries(state.amountInputs).filter(([id]) =>
            withoutSharer.some((e) => e.id === id),
          ),
        ),
      };
    }

    case 'add_expense': {
      if (state.expenses.length >= LIMITS.maxExpenses) {
        return state;
      }
      const id = newId();
      return {
        ...state,
        expenses: [
          ...state.expenses,
          { id, payerId: '', description: '', amountMinor: 0, shares: null },
        ],
        amountInputs: { ...state.amountInputs, [id]: '' },
      };
    }

    case 'update_expense':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      };

    case 'set_amount_input':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.id ? { ...e, amountMinor: action.amountMinor } : e,
        ),
        amountInputs: { ...state.amountInputs, [action.id]: action.value },
      };

    case 'remove_expense': {
      if (state.expenses.length <= 1) {
        return state;
      }
      const { [action.id]: _dropped, ...amountInputs } = state.amountInputs;
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
        amountInputs,
      };
    }

    case 'reset':
      return emptyState(action.currency);

    case 'restore':
      return action.state;

    default:
      return state;
  }
}

/** What actually goes into storage: the draft, and when it was written. */
type Stored = { savedAt: number; state: SplitBillState };

export function serialiseDraft(state: SplitBillState, now: number): string {
  return JSON.stringify({ savedAt: now, state } satisfies Stored);
}

/**
 * Reads a saved draft, or returns null.
 *
 * Every field is checked, and anything past its expiry is dropped. What is
 * stored here came from the same browser, but it is still data of unknown age
 * being fed straight into a calculation, and a half-recognised shape is worse
 * than starting over.
 */
export function parseStored(
  raw: string | null,
  now: number = Date.now(),
): SplitBillState | null {
  if (!raw) {
    return null;
  }
  try {
    const envelope = JSON.parse(raw) as Partial<Stored>;
    if (
      typeof envelope?.savedAt !== 'number' ||
      !Number.isFinite(envelope.savedAt) ||
      now - envelope.savedAt > DRAFT_TTL_MS
    ) {
      return null;
    }
    const value = (envelope.state ?? {}) as Partial<SplitBillState>;
    if (value?.schemaVersion !== SCHEMA_VERSION) {
      return null;
    }
    if (!Array.isArray(value.participants) || !Array.isArray(value.expenses)) {
      return null;
    }
    const participants = value.participants.filter(
      (p): p is Participant =>
        typeof p?.id === 'string' &&
        typeof p?.name === 'string' &&
        typeof p?.weight === 'number' &&
        Number.isFinite(p.weight),
    );
    const expenses = value.expenses.filter(
      (e): e is Expense =>
        typeof e?.id === 'string' &&
        typeof e?.payerId === 'string' &&
        typeof e?.description === 'string' &&
        typeof e?.amountMinor === 'number' &&
        Number.isSafeInteger(e.amountMinor) &&
        (e.shares === null ||
          (typeof e.shares === 'object' &&
            !Array.isArray(e.shares) &&
            Object.values(e.shares).every(
              (w) => typeof w === 'number' && Number.isFinite(w) && w >= 0,
            ))),
    );
    if (participants.length < LIMITS.minParticipants || expenses.length === 0) {
      return null;
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      eventName: typeof value.eventName === 'string' ? value.eventName : '',
      eventDate: typeof value.eventDate === 'string' ? value.eventDate : '',
      currency: (value.currency ?? 'JPY') as CurrencyCode,
      participants,
      expenses,
      amountInputs:
        value.amountInputs && typeof value.amountInputs === 'object'
          ? Object.fromEntries(
              Object.entries(value.amountInputs).filter(
                ([, v]) => typeof v === 'string',
              ),
            )
          : {},
    };
  } catch {
    return null;
  }
}
