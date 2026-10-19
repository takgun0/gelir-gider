// Sabit işlem düzenleme, durdurma ve silme (SPEC §5.3 "Düzenleme ve yaşam döngüsü").
import { isEnded, lastPeriodOnReactivate } from '../../domain/recurring';
import type { Period, Recurring, TxType } from '../../domain/types';
import type { AppDB } from '../db';
import type { OpContext } from '../context';
import { DbError } from '../errors';
import { generateWithin } from './generation';
import { assertAmount, assertCategory, assertSchedule, cleanTexts } from './validate';

export interface RecurringChanges {
  type: TxType;
  amount: number;
  categoryId: string;
  description: string;
  note: string;
  dayOfMonth: number;
  /** undefined: bitiş yok */
  endPeriod?: Period;
}

async function getOrThrow(db: AppDB, id: string): Promise<Recurring> {
  const r = await db.recurrings.get(id);
  if (!r) throw new DbError('notFound');
  return r;
}

/**
 * Değişiklik yalnızca henüz üretilmemiş dönemleri etkiler. Önce eski değerlerle vadesi
 * gelenler üretilir; böylece bitiş uzatılınca aradaki aylar doldurulmaz. startDate değişmez.
 * Yeni değerlerle vadesi gelen olursa (ör. gün öne alındı) hemen üretilir.
 */
export function updateRecurring(db: AppDB, id: string, changes: RecurringChanges, ctx: OpContext): Promise<number> {
  return db.transaction('rw', db.categories, db.transactions, db.recurrings, async () => {
    let generated = await generateWithin(db, id, ctx);
    const current = await getOrThrow(db, id);
    assertAmount(changes.amount);
    await assertCategory(db, changes.categoryId, changes.type);
    assertSchedule(current.startDate, changes.dayOfMonth, changes.endPeriod);
    const { endPeriod: _old, ...rest } = current;
    const next: Recurring = {
      ...rest,
      type: changes.type,
      amount: changes.amount,
      categoryId: changes.categoryId,
      ...cleanTexts(changes),
      dayOfMonth: changes.dayOfMonth,
      ...(changes.endPeriod !== undefined ? { endPeriod: changes.endPeriod } : {}),
      updatedAt: ctx.now,
    };
    await db.recurrings.put(next);
    generated += await generateWithin(db, id, ctx);
    return generated;
  });
}

/**
 * Durdurma ve yeniden açma. Durdurmadan önce vadesi gelenler üretilir. Yeniden açılınca
 * aktife alındığı günden önceki oluşma tarihleri atlanır; bugünkü üretilir.
 */
export function setRecurringActive(db: AppDB, id: string, active: boolean, ctx: OpContext): Promise<number> {
  return db.transaction('rw', db.transactions, db.recurrings, async () => {
    const r = await getOrThrow(db, id);
    if (r.active === active || isEnded(r, ctx.today)) return 0;
    if (!active) {
      const generated = await generateWithin(db, id, ctx);
      await db.recurrings.update(id, { active: false, updatedAt: ctx.now });
      return generated;
    }
    await db.recurrings.update(id, {
      active: true,
      lastGeneratedPeriod: lastPeriodOnReactivate(r, ctx.today),
      updatedAt: ctx.now,
    });
    return generateWithin(db, id, ctx);
  });
}

/** Silme onayındaki "Daha önce eklenen 6 kayıt korunur" sayısı. */
export function countRecurringInstances(db: AppDB, id: string): Promise<number> {
  return db.transactions.where('recurringId').equals(id).count();
}

export interface DeletedRecurring {
  recurring: Recurring;
  links: { id: string; period: Period }[];
}

/** Sabit kaydı siler; ondan üretilmiş kayıtlar kalır, bağları kaldırılır. "Geri al" için yük döner. */
export function deleteRecurring(db: AppDB, id: string): Promise<DeletedRecurring> {
  return db.transaction('rw', db.transactions, db.recurrings, async () => {
    const recurring = await getOrThrow(db, id);
    const linked = await db.transactions.where('recurringId').equals(id).toArray();
    const links: DeletedRecurring['links'] = [];
    for (const t of linked) {
      const { recurringId: _r, period, ...unlinked } = t;
      if (period !== undefined) links.push({ id: t.id, period });
      await db.transactions.put(unlinked);
    }
    await db.recurrings.delete(id);
    return { recurring, links };
  });
}

/** "Geri al": sabit kaydı ve kaldırılan bağları tek transaction'da geri yazar. */
export function undoDeleteRecurring(db: AppDB, deleted: DeletedRecurring): Promise<void> {
  return db.transaction('rw', db.transactions, db.recurrings, async () => {
    await db.recurrings.put(deleted.recurring);
    for (const link of deleted.links) {
      const t = await db.transactions.get(link.id);
      if (!t || t.recurringId !== undefined) continue;
      await db.transactions.put({ ...t, recurringId: deleted.recurring.id, period: link.period });
    }
  });
}
