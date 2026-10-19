// Sabit işlem üretimi (Gereksinimler §5.3 "Üretim"). Açılışta ilk render'dan önce ve sayfa
// yeniden görünür olduğunda çalışır.
import { generateDue } from '../../domain/recurring';
import type { AppDB } from '../db';
import { withLock, type OpContext } from '../context';
import { isConstraintError } from '../errors';

const LOCK_NAME = 'para-yonetimi:sabit-uretim';

/**
 * Tek bir sabit kaydın vadesi gelen dönemlerini üretir. Çağıran, transactions ve
 * recurrings tablolarını kapsayan bir rw transaction içinde olmalı; üretim ve
 * lastGeneratedPeriod güncellemesi böylece birlikte yazılır.
 */
export async function generateWithin(db: AppDB, recurringId: string, ctx: OpContext): Promise<number> {
  const r = await db.recurrings.get(recurringId);
  if (!r) return 0;
  const { drafts, lastGeneratedPeriod } = generateDue(r, ctx.today);
  let added = 0;
  for (const draft of drafts) {
    const exists = await db.transactions.where('[recurringId+period]').equals([draft.recurringId, draft.period]).count();
    if (exists > 0) continue;
    try {
      await db.transactions.add({ ...draft, id: ctx.newId(), createdAt: ctx.now, updatedAt: ctx.now });
      added++;
    } catch (error) {
      // Başka bir sekme aynı dönemi üretmiş: dönem zaten üretilmiş sayılır.
      if (!isConstraintError(error)) throw error;
    }
  }
  if (lastGeneratedPeriod !== r.lastGeneratedPeriod) {
    await db.recurrings.update(r.id, { lastGeneratedPeriod });
  }
  return added;
}

/** Tüm aktif sabit kayıtlar için üretim; üretilen işlem sayısını döner ("N sabit işlem eklendi"). */
export function runGeneration(db: AppDB, ctx: OpContext): Promise<number> {
  return withLock(LOCK_NAME, async () => {
    const ids = await db.recurrings.filter((r) => r.active).primaryKeys();
    let total = 0;
    for (const id of ids) {
      total += await db.transaction('rw', db.transactions, db.recurrings, () => generateWithin(db, id, ctx));
    }
    return total;
  });
}
