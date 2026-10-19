// Tüm tutar biçimlendirmesi burada (Gereksinimler §5.1). Ekranda her tutar <Amount>'tan geçer.
import { toDecimalString } from './money';
import type { TxType } from './types';

/** Gerçek eksi işareti (U+2212). */
export const MINUS = '\u2212';
/** Tutar gizlemede her tutarın yerine geçer. */
export const MASKED_AMOUNT = '₺•••••';
/** Kısa biçimde sayı ile birim arasında bölünmeyen boşluk. */
const NBSP = '\u00a0';

const tryFormat = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const wholeFormat = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function signOf(kurus: number): string {
  return kurus < 0 ? MINUS : '';
}

/** ₺12.450,00 — negatifse başına gerçek eksi işareti gelir. */
export function formatTRY(kurus: number): string {
  return signOf(kurus) + tryFormat.format(toDecimalString(kurus) as Intl.StringNumericLiteral);
}

/** +₺12.450,00 / −₺1.250,00; sıfır işaretsiz. */
export function formatSigned(kurus: number): string {
  const abs = tryFormat.format(toDecimalString(kurus) as Intl.StringNumericLiteral);
  if (kurus > 0) return '+' + abs;
  if (kurus < 0) return MINUS + abs;
  return abs;
}

/** Türe göre işaretli değer: gider negatiftir. */
export function signedAmount(amount: number, type: TxType): number {
  return type === 'expense' ? -amount : amount;
}

/** Kahraman tutar için parçalar: { sign: '+₺', integer: '5.900', fraction: ',00' }. */
export function heroParts(kurus: number, signed: boolean): { sign: string; integer: string; fraction: string } {
  const parts = tryFormat.formatToParts(toDecimalString(kurus) as Intl.StringNumericLiteral);
  let currency = '';
  let integer = '';
  let fraction = '';
  for (const p of parts) {
    if (p.type === 'currency') currency = p.value;
    else if (p.type === 'integer' || p.type === 'group') integer += p.value;
    else if (p.type === 'decimal' || p.type === 'fraction') fraction += p.value;
  }
  const sign = kurus < 0 ? MINUS : signed && kurus > 0 ? '+' : '';
  return { sign: sign + currency, integer, fraction };
}

/**
 * Grafik ekseni ve dar alanlar: ₺12,4 B · ₺1,2 Mn · ₺3 Mr. Bin altı tam TL.
 * Tek ondalık hane, aşağı yuvarlanır (₺12.450 → ₺12,4 B).
 */
export function formatShort(kurus: number): string {
  const lira = Math.floor(Math.abs(kurus) / 100);
  const units: [number, string][] = [
    [1_000_000_000, 'Mr'],
    [1_000_000, 'Mn'],
    [1_000, 'B'],
  ];
  for (const [size, unit] of units) {
    if (lira >= size) {
      const tenths = Math.floor((lira * 10) / size);
      const whole = Math.floor(tenths / 10);
      const decimal = tenths % 10;
      const num = decimal === 0 ? String(whole) : `${whole},${decimal}`;
      return `${signOf(kurus)}₺${num}${NBSP}${unit}`;
    }
  }
  return `${signOf(kurus)}₺${lira}`;
}

/** Tam TL'ye yuvarlar: ₺412. */
export function formatWhole(kurus: number): string {
  const lira = Math.floor((Math.abs(kurus) + 50) / 100);
  return signOf(kurus) + wholeFormat.format(String(lira) as Intl.StringNumericLiteral);
}

/** Tam sayı yüzde: %12; 0 ile %1 arası "<%1". */
export function formatPercent(ratio: number): string {
  if (ratio > 0 && ratio < 0.01) return '<%1';
  return '%' + Math.round(ratio * 100);
}

