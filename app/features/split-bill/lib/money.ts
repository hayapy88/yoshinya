// Money is held as an integer count of the smallest unit — yen, cents — and
// never as a decimal. 10.25 AUD is 1025. Splitting a bill is exactly the kind
// of arithmetic where 0.1 + 0.2 stops being 0.3, and a rounding error here is
// not a display problem: it is somebody paying a cent more than they owe, in a
// table that is supposed to add up.

export type CurrencyCode = 'JPY' | 'AUD' | 'USD' | 'EUR' | 'GBP';

export const CURRENCIES: CurrencyCode[] = ['JPY', 'AUD', 'USD', 'EUR', 'GBP'];

/** Digits after the decimal point, and so the size of the smallest unit. */
const DECIMALS: Record<CurrencyCode, number> = {
  JPY: 0,
  AUD: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
};

export function decimalsFor(currency: CurrencyCode): number {
  return DECIMALS[currency];
}

export function minorPerUnit(currency: CurrencyCode): number {
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
  currency: CurrencyCode,
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
export function minorToInput(minor: number, currency: CurrencyCode): string {
  const decimals = DECIMALS[currency];
  if (decimals === 0) {
    return String(minor);
  }
  const unit = minorPerUnit(currency);
  return (minor / unit).toFixed(decimals);
}

export function formatMoney(
  minor: number,
  currency: CurrencyCode,
  locale: string,
): string {
  const decimals = DECIMALS[currency];
  return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(minor / minorPerUnit(currency));
}
