// İşlem listesinin saf yardımcıları: filtre, arama ve gruplama (DESIGN §6.2).
import { periodOf } from '../../domain/date';
import { signedAmount } from '../../domain/format';
import { includesTr } from '../../domain/text';
import type { Category, DateStr, Period, Transaction, TxType } from '../../domain/types';

export type TypeFilter = 'all' | TxType;

export interface Filters {
  type: TypeFilter;
  categoryIds: ReadonlySet<string>;
}

export const NO_FILTERS: Filters = { type: 'all', categoryIds: new Set() };

export function isFiltered(f: Filters): boolean {
  return f.type !== 'all' || f.categoryIds.size > 0;
}

export function applyFilters<T extends Pick<Transaction, 'type' | 'categoryId'>>(txs: readonly T[], f: Filters): T[] {
  return txs.filter((t) => (f.type === 'all' || t.type === f.type) && (f.categoryIds.size === 0 || f.categoryIds.has(t.categoryId)));
}

/** Açıklama, not ve kategori adında, tr-TR kurallarıyla. */
export function searchTransactions(
  txs: readonly Transaction[],
  query: string,
  categories: ReadonlyMap<string, Pick<Category, 'name'>>,
): Transaction[] {
  if (query.trim() === '') return [...txs];
  return txs.filter(
    (t) =>
      includesTr(t.description, query) ||
      includesTr(t.note, query) ||
      includesTr(categories.get(t.categoryId)?.name ?? '', query),
  );
}

/** Yeniden eskiye; aynı günde son eklenen üstte. */
export function newestFirst(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.createdAt - a.createdAt;
}

export interface DayGroup {
  date: DateStr;
  /** Günün neti (işaretli) */
  net: number;
  items: Transaction[];
}

export function groupByDay(txs: readonly Transaction[]): DayGroup[] {
  const groups = new Map<DateStr, DayGroup>();
  for (const t of [...txs].sort(newestFirst)) {
    let g = groups.get(t.date);
    if (!g) {
      g = { date: t.date, net: 0, items: [] };
      groups.set(t.date, g);
    }
    g.items.push(t);
    g.net += signedAmount(t.amount, t.type);
  }
  return [...groups.values()];
}

export interface MonthGroup {
  period: Period;
  items: Transaction[];
}

/** Arama sonuçları ay başlıklarıyla gruplanır. */
export function groupByMonth(txs: readonly Transaction[]): MonthGroup[] {
  const groups = new Map<Period, MonthGroup>();
  for (const t of [...txs].sort(newestFirst)) {
    const p = periodOf(t.date);
    let g = groups.get(p);
    if (!g) {
      g = { period: p, items: [] };
      groups.set(p, g);
    }
    g.items.push(t);
  }
  return [...groups.values()];
}

/** Satır başlığı: açıklama, yoksa kategori adı. */
export function rowTitle(t: Pick<Transaction, 'description'>, category: Pick<Category, 'name'> | undefined): string {
  return t.description || category?.name || '';
}
