// Özet hesapları (SPEC §6 "Hesaplamalar"). Saf fonksiyonlar; toplamlar tamsayıdır.
// Planlanan örnekler hiçbir toplama girmez; yalnızca ay sonu tahmininde kullanılır.
import {
  addMonths,
  daysInPeriod,
  dayOfMonth,
  makeDate,
  parsePeriod,
  periodOf,
  startOfWeek,
  weekdayIndex,
} from './date';
import { signedAmount } from './format';
import { isEnded, type PlannedItem } from './recurring';
import { compareTr } from './text';
import type { Category, DateStr, Period, Recurring, Transaction, TxType } from './types';

type Tx = Pick<Transaction, 'type' | 'amount' | 'date'>;

export interface Totals {
  income: number;
  expense: number;
  /** gelir − gider */
  net: number;
}

/** Aylık özet: gelir, gider, kalan. */
export function totals(txs: readonly Tx[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense };
}

/** Ay sonu tahmini = gerçekleşmiş net + planlanan gelir − planlanan gider. */
export function monthEndForecast(actualNet: number, planned: readonly Pick<PlannedItem, 'type' | 'amount'>[]): number {
  let forecast = actualNet;
  for (const p of planned) forecast += signedAmount(p.amount, p.type);
  return forecast;
}

/** start ve end dahil aralıktaki gider toplamı. */
export function expenseBetween(txs: readonly Tx[], start: DateStr, end: DateStr): number {
  let sum = 0;
  for (const t of txs) if (t.type === 'expense' && t.date >= start && t.date <= end) sum += t.amount;
  return sum;
}

/**
 * Bugün ve bu hafta: yalnızca gider. Hafta Pazartesi başlar, ay sınırını aşabilir;
 * txs en az haftanın Pazartesi'sinden bugüne kadarki işlemleri içermeli.
 */
export function todayAndWeek(txs: readonly Tx[], today: DateStr): { today: number; week: number } {
  return {
    today: expenseBetween(txs, today, today),
    week: expenseBetween(txs, startOfWeek(today), today),
  };
}

export interface DayBar {
  date: DateStr;
  day: number;
  /** Günün gider toplamı. */
  expense: number;
  /** Günün gider işlemi sayısı (baloncuktaki "3 işlem"). */
  count: number;
  isMonday: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Seçili ayın günlük gider serisi ve ortalaması.
 * İçinde bulunulan ay: bugüne kadarki gider / bugünün gün numarası.
 * Geçmiş ay: ayın toplam gideri / ayın gün sayısı. Gelecek ay: boş, ortalama yok.
 */
export function dailySeries(
  txs: readonly Tx[],
  period: Period,
  today: DateStr,
): { days: DayBar[]; average: number | null } {
  const current = periodOf(today);
  const parts = parsePeriod(period);
  if (!parts || period > current) return { days: [], average: null };

  const n = daysInPeriod(period);
  const days: DayBar[] = [];
  for (let d = 1; d <= n; d++) {
    const date = makeDate(parts.y, parts.m, d);
    days.push({ date, day: d, expense: 0, count: 0, isMonday: weekdayIndex(date) === 0, isToday: date === today, isFuture: date > today });
  }
  let total = 0;
  for (const t of txs) {
    if (t.type !== 'expense' || periodOf(t.date) !== period) continue;
    const bar = days[dayOfMonth(t.date) - 1];
    if (!bar) continue;
    bar.expense += t.amount;
    bar.count += 1;
    total += t.amount;
  }
  const divisor = period === current ? dayOfMonth(today) : n;
  return { days, average: Math.round(total / divisor) };
}

export interface Slice {
  categoryId: string;
  amount: number;
  ratio: number;
}

export interface Breakdown {
  total: number;
  slices: Slice[];
  /** "Diğerleri (n)"; 6'dan fazla kategori yoksa null. */
  others: { count: number; amount: number; ratio: number; categoryIds: string[] } | null;
}

export const BREAKDOWN_TOP = 6;

/** Kategori dağılımı: en büyük 6 kategori ayrı, kalanlar tek dilimde. Tutara göre azalan. */
export function categoryBreakdown(
  txs: readonly Pick<Transaction, 'type' | 'amount' | 'categoryId'>[],
  type: TxType,
  nameOf: (categoryId: string) => string,
  top: number = BREAKDOWN_TOP,
): Breakdown {
  const sums = new Map<string, number>();
  let total = 0;
  for (const t of txs) {
    if (t.type !== type) continue;
    sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amount);
    total += t.amount;
  }
  const ratio = (amount: number) => (total === 0 ? 0 : amount / total);
  const sorted = [...sums.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount, ratio: ratio(amount) }))
    .sort((a, b) => b.amount - a.amount || compareTr(nameOf(a.categoryId), nameOf(b.categoryId)));

  if (sorted.length <= top) return { total, slices: sorted, others: null };
  const rest = sorted.slice(top);
  const amount = rest.reduce((s, x) => s + x.amount, 0);
  return {
    total,
    slices: sorted.slice(0, top),
    others: { count: rest.length, amount, ratio: ratio(amount), categoryIds: rest.map((x) => x.categoryId) },
  };
}

export interface MonthBar {
  period: Period;
  income: number;
  expense: number;
  hasData: boolean;
}

/** Seçili ay dahil geriye n ay (varsayılan 6), eskiden yeniye. */
export function lastMonthsSeries(txs: readonly Tx[], selected: Period, n = 6): MonthBar[] {
  const bars = new Map<Period, MonthBar>();
  for (let i = n - 1; i >= 0; i--) {
    const period = addMonths(selected, -i);
    bars.set(period, { period, income: 0, expense: 0, hasData: false });
  }
  for (const t of txs) {
    const bar = bars.get(periodOf(t.date));
    if (!bar) continue;
    if (t.type === 'income') bar.income += t.amount;
    else bar.expense += t.amount;
    bar.hasData = true;
  }
  return [...bars.values()];
}

/** Aktif ve bitmemiş sabit kayıtların aylık toplamları (İşlemler › Sabit özeti). */
export function recurringTotals(recurrings: readonly Recurring[], today: DateStr): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const r of recurrings) {
    if (!r.active || isEnded(r, today)) continue;
    if (r.type === 'income') income += r.amount;
    else expense += r.amount;
  }
  return { income, expense };
}

/** Filtre ya da arama özeti: "12 işlem · −₺2.340,00". */
export function filterSummary(txs: readonly Pick<Transaction, 'type' | 'amount'>[]): { count: number; net: number } {
  let net = 0;
  for (const t of txs) net += signedAmount(t.amount, t.type);
  return { count: txs.length, net };
}

/** Kategoriler ekranı: kategori başına seçili ayın toplamı. */
export function totalsByCategory(txs: readonly Pick<Transaction, 'amount' | 'categoryId'>[]): Map<string, number> {
  const sums = new Map<string, number>();
  for (const t of txs) sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amount);
  return sums;
}

/**
 * Kategoriler ekranı sıralaması (DESIGN §6.4): bu ayki toplama göre azalan,
 * o ay kullanılmayanlar sonda ve alfabetik.
 */
export function sortByUsage<C extends Pick<Category, 'id' | 'name'>>(categories: readonly C[], sums: Map<string, number>): C[] {
  return [...categories].sort((a, b) => {
    const sa = sums.get(a.id) ?? 0;
    const sb = sums.get(b.id) ?? 0;
    if (sa !== sb) return sb - sa;
    return compareTr(a.name, b.name);
  });
}

