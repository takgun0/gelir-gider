import { describe, expect, it } from 'vitest';
import { MAX_AMOUNT, digitsToKurus, isValidAmount, splitKurus, sumAmounts, toDecimalString } from './money';

describe('money', () => {
  it('geçerli tutar aralığı', () => {
    expect(isValidAmount(1)).toBe(true);
    expect(isValidAmount(MAX_AMOUNT)).toBe(true);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-5)).toBe(false);
    expect(isValidAmount(MAX_AMOUNT + 1)).toBe(false);
    expect(isValidAmount(12.5)).toBe(false);
    expect(isValidAmount(1e21)).toBe(false);
  });

  it('tamsayı toplamı', () => {
    expect(sumAmounts([10, 20, 30])).toBe(60);
    expect(sumAmounts([])).toBe(0);
  });

  it('kuruşu böler ve kesin ondalık string üretir', () => {
    expect(splitKurus(125050)).toEqual({ lira: '1250', kurus: '50' });
    expect(splitKurus(-7)).toEqual({ lira: '0', kurus: '07' });
    expect(toDecimalString(MAX_AMOUNT)).toBe('999999999.99');
  });

  it('rakamlardan kuruş üretir', () => {
    expect(digitsToKurus('1250', '5')).toBe(125050);
    expect(digitsToKurus('', '5')).toBe(50);
    expect(digitsToKurus('12', '')).toBe(1200);
    expect(digitsToKurus('', '')).toBeNull();
    expect(digitsToKurus('1a', '')).toBeNull();
    expect(digitsToKurus('1', '123')).toBeNull();
  });
});
