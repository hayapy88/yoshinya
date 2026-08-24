import { describe, expect, it } from 'vitest';
import {
  formatMoney,
  MAX_AMOUNT_MINOR,
  minorToInput,
  parseAmountToMinor,
} from './money';

describe('parseAmountToMinor', () => {
  it('reads yen as whole units', () => {
    expect(parseAmountToMinor('1000', 'JPY')).toBe(1000);
  });

  it('reads a decimal currency as cents', () => {
    expect(parseAmountToMinor('10.25', 'AUD')).toBe(1025);
    expect(parseAmountToMinor('10.2', 'AUD')).toBe(1020);
    expect(parseAmountToMinor('10', 'AUD')).toBe(1000);
    expect(parseAmountToMinor('.5', 'AUD')).toBe(50);
  });

  it('accepts grouping separators, because people paste them in', () => {
    expect(parseAmountToMinor('1,234,567', 'JPY')).toBe(1234567);
    expect(parseAmountToMinor(' 1 234 ', 'JPY')).toBe(1234);
  });

  it('refuses more decimal places than the currency has', () => {
    expect(parseAmountToMinor('10.255', 'AUD')).toBeNull();
    expect(parseAmountToMinor('100.5', 'JPY')).toBeNull();
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
      expect(parseAmountToMinor(bad, 'JPY')).toBeNull();
    }
  });

  it('refuses an amount beyond the safe ceiling', () => {
    expect(parseAmountToMinor(String(MAX_AMOUNT_MINOR), 'JPY')).toBe(
      MAX_AMOUNT_MINOR,
    );
    expect(parseAmountToMinor(String(MAX_AMOUNT_MINOR + 1), 'JPY')).toBeNull();
  });
});

describe('minorToInput', () => {
  it('round-trips through the field without reformatting what was typed', () => {
    expect(minorToInput(1025, 'AUD')).toBe('10.25');
    expect(minorToInput(1000, 'JPY')).toBe('1000');
    expect(minorToInput(5, 'AUD')).toBe('0.05');
  });
});

describe('formatMoney', () => {
  it('shows yen without decimals', () => {
    expect(formatMoney(37000, 'JPY', 'ja')).toBe('￥37,000');
  });

  it('shows a decimal currency with two places', () => {
    expect(formatMoney(1025, 'AUD', 'en')).toContain('10.25');
  });

  it('formats zero rather than leaving it blank', () => {
    expect(formatMoney(0, 'JPY', 'ja')).toBe('￥0');
  });
});
