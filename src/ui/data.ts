// Canlı veri sorguları (dexie-react-hooks). Bileşenler veritabanına buradan bağlanır.
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { periodRange } from '../domain/date';
import type { Category, Period, Recurring, Transaction } from '../domain/types';
import { db } from '../db/db';

export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => db.categories.toArray(), []);
}

export function useCategoryMap(): Map<string, Category> | undefined {
  const categories = useCategories();
  return useMemo(() => (categories ? new Map(categories.map((c) => [c.id, c])) : undefined), [categories]);
}

/** Ay görünümü tarih aralığı sorgusuyla yüklenir (SPEC §6). */
export function useMonthTransactions(period: Period): Transaction[] | undefined {
  return useLiveQuery(() => {
    const { start, end } = periodRange(period);
    return db.transactions.where('date').between(start, end, true, true).toArray();
  }, [period]);
}

export function useAllTransactions(enabled: boolean): Transaction[] | undefined {
  return useLiveQuery(() => (enabled ? db.transactions.toArray() : Promise.resolve([] as Transaction[])), [enabled]);
}

export function useTransactionCount(): number | undefined {
  return useLiveQuery(() => db.transactions.count(), []);
}

export function useRecurrings(): Recurring[] | undefined {
  return useLiveQuery(() => db.recurrings.toArray(), []);
}
