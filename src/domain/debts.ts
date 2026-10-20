// Borç ve alacak kuralları. Saf fonksiyonlar; toplamlar tamsayıdır.
import { diffDays } from './date';
import type { DateStr, Debt, DebtDirection } from './types';

export const PERSON_MAX = 40;

export type DebtStatus = 'paid' | 'overdue' | 'dueToday' | 'open';

export function debtStatus(d: Pick<Debt, 'paidOn' | 'dueDate'>, today: DateStr): DebtStatus {
  if (d.paidOn !== undefined) return 'paid';
  if (d.dueDate === undefined) return 'open';
  if (d.dueDate < today) return 'overdue';
  if (d.dueDate === today) return 'dueToday';
  return 'open';
}

/** Vadesi kaç gün geçti (geçmediyse 0). */
export function daysOverdue(d: Pick<Debt, 'dueDate' | 'paidOn'>, today: DateStr): number {
  if (d.paidOn !== undefined || d.dueDate === undefined) return 0;
  return Math.max(0, diffDays(d.dueDate, today));
}

/** Açık (ödenmemiş) borç ve alacak toplamları. */
export function openTotals(debts: readonly Pick<Debt, 'direction' | 'amount' | 'paidOn'>[]): {
  payable: number;
  receivable: number;
  payableCount: number;
  receivableCount: number;
} {
  const t = { payable: 0, receivable: 0, payableCount: 0, receivableCount: 0 };
  for (const d of debts) {
    if (d.paidOn !== undefined) continue;
    if (d.direction === 'payable') {
      t.payable += d.amount;
      t.payableCount++;
    } else {
      t.receivable += d.amount;
      t.receivableCount++;
    }
  }
  return t;
}

/**
 * Açık kayıtlar: önce vadesi geçenler, sonra vadesi yakın olanlar, vadesizler en sonda;
 * eşitlikte en eski tarih önce. Kapananlar: en son ödenen önce.
 */
export function sortOpen<D extends Pick<Debt, 'dueDate' | 'date' | 'createdAt'>>(list: readonly D[]): D[] {
  return [...list].sort((a, b) => {
    const da = a.dueDate ?? '9999-12-31';
    const db = b.dueDate ?? '9999-12-31';
    if (da !== db) return da < db ? -1 : 1;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.createdAt - b.createdAt;
  });
}

export function sortPaid<D extends Pick<Debt, 'paidOn' | 'createdAt'>>(list: readonly D[]): D[] {
  return [...list].sort((a, b) => {
    const pa = a.paidOn ?? '';
    const pb = b.paidOn ?? '';
    if (pa !== pb) return pa < pb ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

export function groupDebts<D extends Debt>(debts: readonly D[]): Record<DebtDirection, D[]> & { paid: D[] } {
  const open = debts.filter((d) => d.paidOn === undefined);
  return {
    payable: sortOpen(open.filter((d) => d.direction === 'payable')),
    receivable: sortOpen(open.filter((d) => d.direction === 'receivable')),
    paid: sortPaid(debts.filter((d) => d.paidOn !== undefined)),
  };
}

/** Borç negatif, alacak pozitif gösterilir. */
export function signedDebt(d: Pick<Debt, 'direction' | 'amount'>): number {
  return d.direction === 'payable' ? -d.amount : d.amount;
}
