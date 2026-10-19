import { describe, expect, it } from 'vitest';
import {
  MINUS,
  formatPercent,
  formatShort,
  formatSigned,
  formatTRY,
  formatWhole,
  heroParts,
  signedAmount,
} from './format';

const NBSP = '\u00a0';

describe('formatTRY', () => {
  it('standart biçim, her zaman iki hane', () => {
    expect(formatTRY(125050)).toBe('₺1.250,50');
    expect(formatTRY(1245000)).toBe('₺12.450,00');
    expect(formatTRY(0)).toBe('₺0,00');
    expect(formatTRY(5)).toBe('₺0,05');
    expect(formatTRY(99_999_999_999)).toBe('₺999.999.999,99');
  });

  it('negatif değerde gerçek eksi işareti', () => {
    expect(formatTRY(-273900)).toBe(`${MINUS}₺2.739,00`);
  });
});

describe('formatSigned', () => {
  it('gelir artı, gider gerçek eksi, sıfır işaretsiz', () => {
    expect(formatSigned(signedAmount(1245000, 'income'))).toBe('+₺12.450,00');
    const expense = formatSigned(signedAmount(125000, 'expense'));
    expect(expense).toBe('−₺1.250,00');
    expect(expense.codePointAt(0)).toBe(0x2212);
    expect(formatSigned(0)).toBe('₺0,00');
  });
});

describe('heroParts', () => {
  it('işaret ve ₺, tam kısım, kuruş ayrılır', () => {
    expect(heroParts(590000, true)).toEqual({ sign: '+₺', integer: '5.900', fraction: ',00' });
    expect(heroParts(-184000, true)).toEqual({ sign: '−₺', integer: '1.840', fraction: ',00' });
    expect(heroParts(0, true)).toEqual({ sign: '₺', integer: '0', fraction: ',00' });
    expect(heroParts(500100, false)).toEqual({ sign: '₺', integer: '5.001', fraction: ',00' });
  });
});

describe('formatShort', () => {
  it('bin ve milyon kısaltmaları', () => {
    expect(formatShort(1245000)).toBe(`₺12,4${NBSP}B`);
    expect(formatShort(123456789)).toBe(`₺1,2${NBSP}Mn`);
    expect(formatShort(800000)).toBe(`₺8${NBSP}B`);
    expect(formatShort(2000000)).toBe(`₺20${NBSP}B`);
    expect(formatShort(300000000000)).toBe(`₺3${NBSP}Mr`);
  });

  it('bin altı tam TL, sıfır', () => {
    expect(formatShort(41250)).toBe('₺412');
    expect(formatShort(0)).toBe('₺0');
  });

  it('aşağı yuvarlar, bir üst birime taşmaz', () => {
    expect(formatShort(99999999)).toBe(`₺999,9${NBSP}B`);
  });
});

describe('formatWhole', () => {
  it("tam TL'ye yuvarlar", () => {
    expect(formatWhole(41249)).toBe('₺412');
    expect(formatWhole(41250)).toBe('₺413');
    expect(formatWhole(125000)).toBe('₺1.250');
    expect(formatWhole(0)).toBe('₺0');
  });
});

describe('formatPercent', () => {
  it('tam sayı yüzde ve <%1', () => {
    expect(formatPercent(0.12)).toBe('%12');
    expect(formatPercent(0.004)).toBe('<%1');
    expect(formatPercent(0)).toBe('%0');
    expect(formatPercent(1)).toBe('%100');
    expect(formatPercent(7500 / 14600)).toBe('%51');
  });
});
