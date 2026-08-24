// Money is held as an integer count of the smallest unit — yen, cents — and
// never as a decimal. 10.25 is 1025. Splitting a bill is exactly the kind of
// arithmetic where 0.1 + 0.2 stops being 0.3, and a rounding error here is not
// a display problem: it is somebody paying a cent more than they owe, in a
// table that is supposed to add up.

/**
 * Currencies are chosen by symbol rather than by code.
 *
 * A code has to be reconciled with the page language before it can be shown,
 * and `Intl` gives up when they disagree: an English page asked for JPY prints
 * "JPY 5,031" rather than a symbol. Codes also multiply without adding
 * anything — AUD, USD, CAD, SGD, NZD and HKD are all "$" to the people
 * splitting the bill, and a group settling up already knows which dollar they
 * are in.
 *
 * What actually matters to the arithmetic is how many decimal places the
 * currency has, and that is what this list carries.
 */
export type Currency = 'yen' | 'dollar' | 'euro' | 'pound' | 'won';

export const CURRENCIES: Currency[] = ['yen', 'dollar', 'euro', 'pound', 'won'];

const SYMBOLS: Record<Currency, string> = {
  yen: '¥',
  dollar: '$',
  euro: '€',
  pound: '£',
  won: '₩',
};

/** Digits after the decimal point, and so the size of the smallest unit. */
const DECIMALS: Record<Currency, number> = {
  yen: 0,
  dollar: 2,
  euro: 2,
  pound: 2,
  // The second currency here with no subunit in practice. A won shown as
  // "₩1,000.00" reads as a mistake, and rounding it to cents would invent a
  // precision the money does not have.
  won: 0,
};

export function symbolFor(currency: Currency): string {
  return SYMBOLS[currency];
}

export function decimalsFor(currency: Currency): number {
  return DECIMALS[currency];
}

export function minorPerUnit(currency: Currency): number {
  return 10 ** DECIMALS[currency];
}

/**
 * The largest amount a single expense may hold.
 *
 * Kept well inside the safe integer range: totals are summed and then
 * multiplied by weights, so the ceiling has to leave room for a hundred of
 * these added together and scaled without the arithmetic quietly losing
 * precision.
 */
export const MAX_AMOUNT_MINOR = 1_000_000_000_000;

/**
 * Reads what someone typed into an integer of the smallest unit.
 *
 * Returns null for anything that is not a plain positive amount. Grouping
 * separators are accepted because people paste them in; exponents, infinities
 * and negatives are refused rather than coerced, since every one of them would
 * otherwise produce a confident and wrong settlement.
 */
export function parseAmountToMinor(
  input: string,
  currency: Currency,
): number | null {
  const cleaned = input.trim().replace(/[,\s]/g, '');
  if (cleaned === '') {
    return null;
  }
  // Deliberately strict: Number() would accept '1e5', '0x10' and 'Infinity'.
  if (!/^\d*(\.\d*)?$/.test(cleaned)) {
    return null;
  }
  const [whole, fraction = ''] = cleaned.split('.');
  const decimals = DECIMALS[currency];
  if (fraction.length > decimals) {
    return null;
  }
  const padded = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  const minor = Number(`${whole || '0'}${padded}`);
  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > MAX_AMOUNT_MINOR) {
    return null;
  }
  return minor;
}

/** The value to show in an input, so editing an amount does not reformat it. */
export function minorToInput(minor: number, currency: Currency): string {
  const decimals = DECIMALS[currency];
  if (decimals === 0) {
    return String(minor);
  }
  return (minor / minorPerUnit(currency)).toFixed(decimals);
}

/**
 * The symbol and the grouped number, assembled here rather than by `Intl`'s
 * currency style — which is what put a three-letter code on the page whenever
 * the currency and the page language disagreed.
 */
export function formatMoney(
  minor: number,
  currency: Currency,
  locale: string,
): string {
  const decimals = DECIMALS[currency];
  const number = new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(minor / minorPerUnit(currency));
  return `${SYMBOLS[currency]}${number}`;
}
