// Borç ve alacak işlemleri: ekle, düzenle, ödendi işaretle, sil ve geri al.
import { isValidDate } from '../../domain/date';
import { PERSON_MAX } from '../../domain/debts';
import type { DateStr, Debt, DebtDirection } from '../../domain/types';
import type { AppDB } from '../db';
import type { OpContext } from '../context';
import { DbError } from '../errors';
import { assertAmount, assertDate, cleanTexts } from './validate';

export interface DebtInput {
  direction: DebtDirection;
  amount: number;
  person: string;
  date: DateStr;
  dueDate?: DateStr | undefined;
  description: string;
  note: string;
}

function checked(input: DebtInput, ctx: OpContext) {
  assertAmount(input.amount);
  assertDate(input.date, ctx.today);
  const person = input.person.trim();
  if (person.length === 0 || person.length > PERSON_MAX || /[\r\n]/.test(person)) throw new DbError('invalidText');
  if (input.dueDate !== undefined && !isValidDate(input.dueDate)) throw new DbError('invalidDate');
  return {
    direction: input.direction,
    amount: input.amount,
    person,
    date: input.date,
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    ...cleanTexts(input),
  };
}

export async function addDebt(db: AppDB, input: DebtInput, ctx: OpContext): Promise<string> {
  const debt: Debt = { id: ctx.newId(), ...checked(input, ctx), createdAt: ctx.now, updatedAt: ctx.now };
  await db.debts.add(debt);
  return debt.id;
}

/** Ödenme durumu düzenlemede korunur. */
export function updateDebt(db: AppDB, id: string, input: DebtInput, ctx: OpContext): Promise<void> {
  return db.transaction('rw', db.debts, async () => {
    const existing = await db.debts.get(id);
    if (!existing) throw new DbError('notFound');
    const next: Debt = {
      id,
      ...checked(input, ctx),
      ...(existing.paidOn !== undefined ? { paidOn: existing.paidOn } : {}),
      createdAt: existing.createdAt,
      updatedAt: ctx.now,
    };
    await db.debts.put(next);
  });
}

/** paidOn verilirse ödendi, null ise yeniden açık. Önceki kaydı ("Geri al" için) döner. */
export function setDebtPaid(db: AppDB, id: string, paidOn: DateStr | null, ctx: OpContext): Promise<Debt> {
  return db.transaction('rw', db.debts, async () => {
    const existing = await db.debts.get(id);
    if (!existing) throw new DbError('notFound');
    const { paidOn: _old, ...rest } = existing;
    if (paidOn !== null && !isValidDate(paidOn)) throw new DbError('invalidDate');
    await db.debts.put({ ...rest, ...(paidOn !== null ? { paidOn } : {}), updatedAt: ctx.now });
    return existing;
  });
}

export function deleteDebt(db: AppDB, id: string): Promise<Debt | undefined> {
  return db.transaction('rw', db.debts, async () => {
    const existing = await db.debts.get(id);
    if (existing) await db.debts.delete(id);
    return existing;
  });
}

/** "Geri al": kaydı önceki haliyle aynen geri yazar. */
export async function restoreDebt(db: AppDB, record: Debt): Promise<void> {
  await db.debts.put(record);
}
