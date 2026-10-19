// Tutarlar kuruş cinsinden pozitif tamsayıdır (SPEC §4). Hiçbir hesapta float yok.

/** ₺999.999.999,99 */
export const MAX_AMOUNT = 99_999_999_999;

export function isValidAmount(kurus: number): boolean {
  return Number.isSafeInteger(kurus) && kurus >= 1 && kurus <= MAX_AMOUNT;
}

export function sumAmounts(values: Iterable<number>): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

/** Mutlak değeri tam TL ve kuruş olarak ayırır: 125050 → { lira: '1250', kurus: '50' }. */
export function splitKurus(kurus: number): { lira: string; kurus: string } {
  const abs = Math.abs(kurus);
  const lira = Math.floor(abs / 100);
  return { lira: String(lira), kurus: String(abs - lira * 100).padStart(2, '0') };
}

/** Intl'e verilecek kesin ondalık string: 125050 → '1250.50' (mutlak değer). */
export function toDecimalString(kurus: number): string {
  const { lira, kurus: k } = splitKurus(kurus);
  return `${lira}.${k}`;
}

/**
 * Rakam dizilerinden kuruş üretir; string işlemidir, parseFloat kullanılmaz.
 * intDigits ve fracDigits yalnızca rakam içermeli, fracDigits en fazla 2 hane.
 */
export function digitsToKurus(intDigits: string, fracDigits: string): number | null {
  if (!/^\d*$/.test(intDigits) || !/^\d{0,2}$/.test(fracDigits)) return null;
  if (intDigits === '' && fracDigits === '') return null;
  const value = Number((intDigits === '' ? '0' : intDigits) + fracDigits.padEnd(2, '0'));
  return Number.isSafeInteger(value) ? value : null;
}
