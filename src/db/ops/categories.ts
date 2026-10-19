// Kategori ekleme, düzenleme ve silme (Gereksinimler §5.4, Tasarım §6.4).
import { findSystemCategory, validateCategoryName } from '../../domain/categories';
import { ICON_KEYS, PALETTE_KEYS, type Category, type IconKey, type PaletteKey, type TxType } from '../../domain/types';
import type { AppDB } from '../db';
import type { OpContext } from '../context';
import { DbError } from '../errors';

export interface CategoryInput {
  name: string;
  color: PaletteKey;
  icon: IconKey;
}

function assertAppearance(input: CategoryInput): void {
  if (!(PALETTE_KEYS as readonly string[]).includes(input.color)) throw new DbError('invalidText');
  if (!(ICON_KEYS as readonly string[]).includes(input.icon)) throw new DbError('invalidText');
}

async function assertName(db: AppDB, name: string, type: TxType, selfId?: string): Promise<void> {
  const error = validateCategoryName(name, type, await db.categories.where('type').equals(type).toArray(), selfId);
  if (error) throw new DbError(error);
}

/** Tür yalnızca oluştururken seçilir. */
export function addCategory(db: AppDB, type: TxType, input: CategoryInput, ctx: OpContext): Promise<string> {
  return db.transaction('rw', db.categories, async () => {
    assertAppearance(input);
    await assertName(db, input.name, type);
    const category: Category = {
      id: ctx.newId(),
      name: input.name.trim(),
      type,
      color: input.color,
      icon: input.icon,
      isSystem: false,
      createdAt: ctx.now,
    };
    await db.categories.add(category);
    return category.id;
  });
}

/** Ad, renk ve ikon değişebilir; sistem kategorileri dahil. Tür değişmez. */
export function updateCategory(db: AppDB, id: string, input: CategoryInput): Promise<void> {
  return db.transaction('rw', db.categories, async () => {
    const existing = await db.categories.get(id);
    if (!existing) throw new DbError('notFound');
    assertAppearance(input);
    await assertName(db, input.name, existing.type, id);
    await db.categories.put({ ...existing, name: input.name.trim(), color: input.color, icon: input.icon });
  });
}

/** Silme onayındaki "14 işlem ve 1 sabit işlem" sayıları. */
export async function categoryUsage(db: AppDB, id: string): Promise<{ transactions: number; recurrings: number }> {
  return db.transaction('r', db.transactions, db.recurrings, async () => ({
    transactions: await db.transactions.where('categoryId').equals(id).count(),
    recurrings: await db.recurrings.where('categoryId').equals(id).count(),
  }));
}

/** Bağlı işlemler ve sabit kayıtlar tek transaction'da aynı türün "Diğer"ine taşınır. */
export function deleteCategory(db: AppDB, id: string): Promise<{ transactions: number; recurrings: number }> {
  return db.transaction('rw', db.categories, db.transactions, db.recurrings, async () => {
    const category = await db.categories.get(id);
    if (!category) throw new DbError('notFound');
    if (category.isSystem) throw new DbError('systemCategory');
    const target = findSystemCategory(await db.categories.where('type').equals(category.type).toArray(), category.type);
    if (!target) throw new DbError('notFound');
    const transactions = await db.transactions.where('categoryId').equals(id).modify({ categoryId: target.id });
    const recurrings = await db.recurrings.where('categoryId').equals(id).modify({ categoryId: target.id });
    await db.categories.delete(id);
    return { transactions, recurrings };
  });
}
