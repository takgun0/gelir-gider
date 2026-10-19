// İşlem ekleme, düzenleme, silme ve geri al (SPEC §5.3 "Oluşturma", DESIGN §6.3).
import { periodOf } from '../../domain/date';
import type { Recurring, Transaction } from '../../domain/types';
import type { AppDB } from '../db';
import type { OpContext } from '../context';
import { DbError } from '../errors';
import { generateWithin } from './generation';
import {
  assertAmount,
  assertCategory,
  assertDate,
  assertSchedule,
  cleanTexts,
  type RepeatInput,
  type TransactionInput,
} from './validate';

export interface SaveResult {
  id: string;
  /** "Her ay tekrarla" açıksa oluşan sabit kaydın kimliği. */
  recurringId?: string;
  /** Kaçırılan aylar için hemen üretilen işlem sayısı. */
  generated: number;
}

async function checkedFields(db: AppDB, input: TransactionInput, ctx: OpContext) {
  assertAmount(input.amount);
  assertDate(input.date, ctx.today);
  await assertCategory(db, input.categoryId, input.type);
  return { type: input.type, amount: input.amount, categoryId: input.categoryId, date: input.date, ...cleanTexts(input) };
}

/**
 * Sabit kaydı oluşturur ve verilen işlemi ilk örneği yapar: startDate işlemin tarihi,
 * lastGeneratedPeriod işlemin ayı. İlk örnek geçmiş bir aydaysa aradaki aylar hemen üretilir.
 */
async function attachNewRecurring(db: AppDB, tx: Transaction, repeat: RepeatInput, ctx: OpContext): Promise<SaveResult> {
  assertSchedule(tx.date, repeat.dayOfMonth, repeat.endPeriod);
  const period = periodOf(tx.date);
  const recurring: Recurring = {
    id: ctx.newId(),
    type: tx.type,
    amount: tx.amount,
    categoryId: tx.categoryId,
    description: tx.description,
    note: tx.note,
    dayOfMonth: repeat.dayOfMonth,
    startDate: tx.date,
    ...(repeat.endPeriod !== undefined ? { endPeriod: repeat.endPeriod } : {}),
    active: true,
    lastGeneratedPeriod: period,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };
  await db.recurrings.add(recurring);
  await db.transactions.put({ ...tx, recurringId: recurring.id, period });
  const generated = await generateWithin(db, recurring.id, ctx);
  return { id: tx.id, recurringId: recurring.id, generated };
}

/** Yeni işlem; repeat verilirse aynı transaction'da sabit işlem de oluşur. */
export function addTransaction(db: AppDB, input: TransactionInput, ctx: OpContext, repeat?: RepeatInput): Promise<SaveResult> {
  return db.transaction('rw', db.categories, db.transactions, db.recurrings, async () => {
    const fields = await checkedFields(db, input, ctx);
    const tx: Transaction = { id: ctx.newId(), ...fields, createdAt: ctx.now, updatedAt: ctx.now };
    if (repeat) return attachNewRecurring(db, tx, repeat, ctx);
    await db.transactions.add(tx);
    return { id: tx.id, generated: 0 };
  });
}

/**
 * Var olan işlemi düzenler. Sabit işleme bağlı kayıtta recurringId ve period korunur,
 * tarih başka aya taşınsa bile. Bağsız kayıtta repeat verilirse kayıt yeni bir sabit
 * işlemin ilk örneği olur.
 */
export function updateTransaction(
  db: AppDB,
  id: string,
  input: TransactionInput,
  ctx: OpContext,
  repeat?: RepeatInput,
): Promise<SaveResult> {
  return db.transaction('rw', db.categories, db.transactions, db.recurrings, async () => {
    const existing = await db.transactions.get(id);
    if (!existing) throw new DbError('notFound');
    if (repeat && existing.recurringId !== undefined) throw new DbError('alreadyRecurring');
    const fields = await checkedFields(db, input, ctx);
    const next: Transaction = { ...existing, ...fields, updatedAt: ctx.now };
    if (repeat) return attachNewRecurring(db, next, repeat, ctx);
    await db.transactions.put(next);
    return { id, generated: 0 };
  });
}

/** Siler ve "Geri al" için silinen kaydı döner. Silinen üretilmiş kayıt yeniden üretilmez. */
export function deleteTransaction(db: AppDB, id: string): Promise<Transaction | undefined> {
  return db.transaction('rw', db.transactions, async () => {
    const existing = await db.transactions.get(id);
    if (existing) await db.transactions.delete(id);
    return existing;
  });
}

/**
 * "Geri al": silinen kaydı aynen geri yazar. Bu arada sabit işlem silinmişse ya da aynı
 * dönem başka bir kayıtla doluysa bağ kaldırılarak yazılır.
 */
export function restoreTransaction(db: AppDB, record: Transaction): Promise<void> {
  return db.transaction('rw', db.transactions, db.recurrings, async () => {
    if (record.recurringId !== undefined && record.period !== undefined) {
      const recurring = await db.recurrings.get(record.recurringId);
      const taken = await db.transactions.where('[recurringId+period]').equals([record.recurringId, record.period]).count();
      if (!recurring || taken > 0) {
        const { recurringId: _r, period: _p, ...unlinked } = record;
        await db.transactions.put(unlinked);
        return;
      }
    }
    await db.transactions.put(record);
  });
}
