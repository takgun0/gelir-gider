// DB testleri için yardımcılar (yalnızca *.test.ts dosyalarından içe aktarılır).
import 'fake-indexeddb/auto';
import { findSystemCategory } from '../domain/categories';
import { toDateStr } from '../domain/date';
import type { Category, TxType } from '../domain/types';
import type { OpContext } from './context';
import { AppDB } from './db';

export async function openTestDb(): Promise<AppDB> {
  const db = new AppDB(`test-${crypto.randomUUID()}`);
  await db.open();
  return db;
}

/** Sabit "bugün" ile bağlam; yerel saatle öğlen, saat dilimi testlerinde gün kaymasın. */
export function ctxAt(date: string): OpContext {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const at = new Date(y, m - 1, d, 12, 0);
  return { now: at.getTime(), today: toDateStr(at), newId: () => crypto.randomUUID() };
}

export async function categoryByName(db: AppDB, type: TxType, name: string): Promise<Category> {
  const found = (await db.categories.where('type').equals(type).toArray()).find((c) => c.name === name);
  if (!found) throw new Error(`Kategori yok: ${name}`);
  return found;
}

export async function systemCategory(db: AppDB, type: TxType): Promise<Category> {
  const found = findSystemCategory(await db.categories.toArray(), type);
  if (!found) throw new Error('Sistem kategorisi yok');
  return found;
}
