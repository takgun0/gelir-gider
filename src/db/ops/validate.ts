// DB katmanının son savunma hattı: formdan gelen değerler yazılmadan önce denetlenir.
import { isValidDate, isValidPeriod } from '../../domain/date';
import { isValidAmount } from '../../domain/money';
import { isValidEndPeriod } from '../../domain/recurring';
import type { DateStr, Period, TxType } from '../../domain/types';
import type { AppDB } from '../db';
import { DbError } from '../errors';

export interface TransactionInput {
  type: TxType;
  amount: number;
  categoryId: string;
  date: DateStr;
  description: string;
  note: string;
}

export interface RepeatInput {
  /** 1–31 */
  dayOfMonth: number;
  endPeriod?: Period;
}

export const DESCRIPTION_MAX = 80;
export const NOTE_MAX = 500;

/** Açıklama tek satır ve kırpılmış, not kırpılmış yazılır. */
export function cleanTexts(input: { description: string; note: string }): { description: string; note: string } {
  const description = input.description.trim();
  const note = input.note.trim();
  if (description.length > DESCRIPTION_MAX || /[\r\n]/.test(description) || note.length > NOTE_MAX) {
    throw new DbError('invalidText');
  }
  return { description, note };
}

export async function assertCategory(db: AppDB, categoryId: string, type: TxType): Promise<void> {
  const category = await db.categories.get(categoryId);
  if (!category) throw new DbError('categoryMissing');
  if (category.type !== type) throw new DbError('typeMismatch');
}

export function assertAmount(amount: number): void {
  if (!isValidAmount(amount)) throw new DbError('invalidAmount');
}

/** Elle girilen işlemin tarihi en fazla bugün olabilir. */
export function assertDate(date: DateStr, today: DateStr): void {
  if (!isValidDate(date)) throw new DbError('invalidDate');
  if (date > today) throw new DbError('futureDate');
}

export function assertSchedule(startDate: DateStr, dayOfMonth: number, endPeriod: Period | undefined): void {
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) throw new DbError('invalidDay');
  if (endPeriod !== undefined && (!isValidPeriod(endPeriod) || !isValidEndPeriod(startDate, endPeriod))) {
    throw new DbError('invalidEnd');
  }
}
