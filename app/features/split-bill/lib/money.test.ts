import { describe, expect, it } from 'vitest';
import {
  decimalsFor,
  formatMoney,
  MAX_AMOUNT_MINOR,
  minorToInput,
  parseAmountToMinor,
} from './money';

describe('parseAmountToMinor', () => {
  it('reads yen as whole units', () => {
    expect(parseAmountToMinor('1000', 'yen')).toBe(1000);
  });

  it('reads a decimal currency as cents', () => {
    expect(parseAmountToMinor('10.25', 'dollar')).toBe(1025);
    expect(parseAmountToMinor('10.2', 'dollar')).toBe(1020);
    expect(parseAmountToMinor('10', 'dollar')).toBe(1000);
    expect(parseAmountToMinor('.5', 'dollar')).toBe(50);
  });

  it('accepts grouping separators, because people paste them in', () => {
    expect(parseAmountToMinor('1,234,567', 'yen')).toBe(1234567);
    expect(parseAmountToMinor(' 1 234 ', 'yen')).toBe(1234);
  });

  it('refuses more decimal places than the currency has', () => {
    expect(parseAmountToMinor('10.255', 'dollar')).toBeNull();
    expect(parseAmountToMinor('100.5', 'yen')).toBeNull();
  });

  // Number() would accept every one of these and turn a typo into a confident
  // settlement for the wrong amount.
  it('refuses anything that is not a plain positive number', () => {
    for (const bad of [
      '',
      '-100',
      'abc',
      '1e5',
      'Infinity',
      'NaN',
      '0x10',
      '1.2.3',
      '0',
    ]) {
      expect(parseAmountToMinor(bad, 'yen')).toBeNull();
    }
  });

  it('refuses an amount beyond the safe ceiling', () => {
    expect(parseAmountToMinor(String(MAX_AMOUNT_MINOR), 'yen')).toBe(
      MAX_AMOUNT_MINOR,
    );
    expect(parseAmountToMinor(String(MAX_AMOUNT_MINOR + 1), 'yen')).toBeNull();
  });
});

describe('minorToInput', () => {
  it('round-trips through the field without reformatting what was typed', () => {
    expect(minorToInput(1025, 'dollar')).toBe('10.25');
    expect(minorToInput(1000, 'yen')).toBe('1000');
    expect(minorToInput(5, 'dollar')).toBe('0.05');
  });
});

describe('formatMoney', () => {
  it('shows yen without decimals', () => {
    expect(formatMoney(37000, 'yen', 'ja')).toBe('¥37,000');
  });

  it('shows a decimal currency with two places', () => {
    expect(formatMoney(1025, 'dollar', 'en')).toContain('10.25');
  });

  it('formats zero rather than leaving it blank', () => {
    expect(formatMoney(0, 'yen', 'ja')).toBe('¥0');
  });

  // The reason for dropping currency codes: Intl printed "JPY 5,031" whenever
  // the page language and the currency disagreed, which is most of the time
  // for a traveller.
  it('shows a symbol whichever language the page is in', () => {
    expect(formatMoney(5031, 'yen', 'en')).toBe('¥5,031');
    expect(formatMoney(1025, 'dollar', 'ja')).toBe('$10.25');
    expect(formatMoney(1025, 'euro', 'en')).toBe('€10.25');
    expect(formatMoney(1025, 'pound', 'ja')).toBe('£10.25');
  });
});

describe('the won', () => {
  // The only currency besides the yen here without a subunit. "₩1,000.00"
  // reads as a mistake, and cents would invent a precision it does not have.
  it('has no decimal places', () => {
    expect(formatMoney(1000, 'won', 'ja')).toBe('₩1,000');
    expect(decimalsFor('won')).toBe(0);
  });

  it('refuses an amount with a fraction', () => {
    expect(parseAmountToMinor('1000.5', 'won')).toBeNull();
    expect(parseAmountToMinor('1000', 'won')).toBe(1000);
  });
});
