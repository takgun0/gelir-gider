// Yedek, geri yükleme, CSV ve tüm verileri silme (Gereksinimler §5.5, Tasarım §6.6).
import { buildBackup, type BackupData, type BackupFile } from '../../domain/backup';
import { defaultCategoryRecords } from '../../domain/categories';
import { buildCsv } from '../../domain/csv';
import type { Settings } from '../../domain/types';
import type { AppDB } from '../db';
import type { OpContext } from '../context';
import { runGeneration } from './generation';

export function readAllData(db: AppDB): Promise<BackupData> {
  return db.transaction('r', db.categories, db.transactions, db.recurrings, async () => ({
    categories: await db.categories.toArray(),
    transactions: await db.transactions.toArray(),
    recurrings: await db.recurrings.toArray(),
  }));
}

export async function createBackup(db: AppDB, now: Date): Promise<BackupFile> {
  return buildBackup(await readAllData(db), now);
}

export async function getSettings(db: AppDB): Promise<Settings> {
  return (await db.settings.get('app')) ?? { id: 'app' };
}

/** Yalnızca JSON yedeği başarıyla indirilince çağrılır; CSV çağırmaz. */
export async function markBackupTaken(db: AppDB, now: number): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    await db.settings.put({ ...(await getSettings(db)), lastBackupAt: now });
  });
}

export async function exportCsv(db: AppDB): Promise<string> {
  const { categories, transactions } = await readAllData(db);
  return buildCsv(transactions, new Map(categories.map((c) => [c.id, c])));
}

/** "Şu an 412 işlem → Yedekte 380 işlem" */
export function transactionCount(db: AppDB): Promise<number> {
  return db.transactions.count();
}

/**
 * Doğrulanmış yedeği yazar: tablolar tek rw transaction'da temizlenip yeniden yazılır,
 * birleştirme yapılmaz. Ardından kaçırılan aylar için üretim çalışır. Ayarlar yedekte
 * olmadığı için korunur.
 */
export async function restoreBackup(db: AppDB, backup: BackupFile, ctx: OpContext): Promise<number> {
  await db.transaction('rw', db.categories, db.transactions, db.recurrings, async () => {
    await Promise.all([db.categories.clear(), db.transactions.clear(), db.recurrings.clear()]);
    await db.categories.bulkAdd(backup.data.categories);
    await db.recurrings.bulkAdd(backup.data.recurrings);
    await db.transactions.bulkAdd(backup.data.transactions);
  });
  return runGeneration(db, ctx);
}

/** "Tüm verileri sil": her şey silinir, varsayılan kategoriler geri gelir. */
export async function deleteAllData(db: AppDB, ctx: OpContext): Promise<void> {
  await db.transaction('rw', db.categories, db.transactions, db.recurrings, db.settings, async () => {
    await Promise.all([db.categories.clear(), db.transactions.clear(), db.recurrings.clear(), db.settings.clear()]);
    await db.categories.bulkAdd(defaultCategoryRecords(ctx.now, ctx.newId));
  });
}
