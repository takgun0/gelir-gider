// Özet'ten İşlemler'e geçerken router state ile taşınan filtre (SPEC §6).
import type { DateStr, TxType } from '../domain/types';

export interface TransactionsNavState {
  type?: TxType;
  categoryId?: string;
  /** O günün grubuna kaydırılır. */
  day?: DateStr;
  /** "/" kısayolu: arama açık gelsin. */
  search?: boolean;
}

export function readNavState(state: unknown): TransactionsNavState {
  if (typeof state !== 'object' || state === null) return {};
  const s = state as Record<string, unknown>;
  const out: TransactionsNavState = {};
  if (s.type === 'income' || s.type === 'expense') out.type = s.type;
  if (typeof s.categoryId === 'string') out.categoryId = s.categoryId;
  if (typeof s.day === 'string') out.day = s.day;
  if (s.search === true) out.search = true;
  return out;
}
