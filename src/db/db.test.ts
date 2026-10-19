import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildBackup, parseBackup, serializeBackup } from '../domain/backup';
import type { Transaction } from '../domain/types';
import type { AppDB } from './db';
import { DbError, isConstraintError } from './errors';
import { addCategory, categoryUsage, deleteCategory, updateCategory } from './ops/categories';
import { createBackup, deleteAllData, exportCsv, getSettings, markBackupTaken, readAllData, restoreBackup } from './ops/data';
import { runGeneration } from './ops/generation';
import {
  countRecurringInstances,
  deleteRecurring,
  setRecurringActive,
  undoDeleteRecurring,
  updateRecurring,
} from './ops/recurrings';
import { addTransaction, deleteTransaction, restoreTransaction, updateTransaction } from './ops/transactions';
import { categoryByName, ctxAt, openTestDb, systemCategory } from './testing';

let db: AppDB;

beforeEach(async () => {
  db = await openTestDb();
});

afterEach(async () => {
  await db.delete();
});

async function expense(categoryName = 'Market') {
  const c = await categoryByName(db, 'expense', categoryName);
  return { type: 'expense' as const, amount: 34000, categoryId: c.id, date: '2026-10-18', description: 'Migros', note: '' };
}

const code = (e: unknown) => (e instanceof DbError ? e.code : e);

describe('şema ve varsayılanlar', () => {
  it('ilk açılışta 14 varsayılan kategori yüklenir', async () => {
    const all = await db.categories.toArray();
    expect(all).toHaveLength(14);
    expect(all.filter((c) => c.isSystem).map((c) => c.type).sort()).toEqual(['expense', 'income']);
  });

  it('populate yalnızca bir kez çalışır', async () => {
    const name = db.name;
    db.close();
    await db.open();
    expect(await db.categories.count()).toBe(14);
    expect(db.name).toBe(name);
  });

  it('aynı [recurringId+period] ikinci kez eklenemez; bağsız kayıtlar birbirini engellemez', async () => {
    const base = await expense();
    const tx = (id: string, extra: Partial<Transaction> = {}): Transaction => ({ id, ...base, createdAt: 0, updatedAt: 0, ...extra });
    await db.transactions.bulkAdd([tx('a'), tx('b'), tx('c')]);
    await db.transactions.add(tx('d', { recurringId: 'r', period: '2026-10' }));
    await db.transactions.add(tx('e', { recurringId: 'r', period: '2026-11' }));
    await expect(db.transactions.add(tx('f', { recurringId: 'r', period: '2026-10' }))).rejects.toMatchObject({ name: 'ConstraintError' });
    expect(await db.transactions.count()).toBe(5);
  });

  it('transaction içinde yakalanan ConstraintError transaction’ı iptal etmez', async () => {
    const base = await expense();
    const tx = (id: string, period: string): Transaction => ({ id, ...base, recurringId: 'r', period, createdAt: 0, updatedAt: 0 });
    await db.transactions.add(tx('a', '2026-10'));
    await db.transaction('rw', db.transactions, async () => {
      await db.transactions.add(tx('b', '2026-10')).catch((e: unknown) => {
        if (!isConstraintError(e)) throw e;
      });
      await db.transactions.add(tx('c', '2026-11'));
    });
    expect((await db.transactions.toArray()).map((t) => t.id).sort()).toEqual(['a', 'c']);
  });
});

describe('işlemler', () => {
  const ctx = ctxAt('2026-10-18');

  it('ekler, bağ alanlarını hiç yazmaz', async () => {
    const { id } = await addTransaction(db, { ...(await expense()), description: '  Migros  ' }, ctx);
    const saved = await db.transactions.get(id);
    expect(saved).toMatchObject({ description: 'Migros', amount: 34000, createdAt: ctx.now });
    expect(saved && 'recurringId' in saved).toBe(false);
    expect(saved && 'period' in saved).toBe(false);
  });

  it('geçersiz girdiyi reddeder', async () => {
    const base = await expense();
    const maas = await categoryByName(db, 'income', 'Maaş');
    await expect(addTransaction(db, { ...base, amount: 0 }, ctx).catch(code)).resolves.toBe('invalidAmount');
    await expect(addTransaction(db, { ...base, date: '2026-10-19' }, ctx).catch(code)).resolves.toBe('futureDate');
    await expect(addTransaction(db, { ...base, categoryId: maas.id }, ctx).catch(code)).resolves.toBe('typeMismatch');
    await expect(addTransaction(db, { ...base, categoryId: 'yok' }, ctx).catch(code)).resolves.toBe('categoryMissing');
    await expect(addTransaction(db, { ...base, description: 'a\nb' }, ctx).catch(code)).resolves.toBe('invalidText');
    expect(await db.transactions.count()).toBe(0);
  });

  it('sil ve geri al kaydı aynen geri getirir', async () => {
    const { id } = await addTransaction(db, await expense(), ctx);
    const before = await db.transactions.get(id);
    const deleted = await deleteTransaction(db, id);
    expect(await db.transactions.get(id)).toBeUndefined();
    await restoreTransaction(db, deleted!);
    expect(await db.transactions.get(id)).toEqual(before);
  });
});

describe('sabit işlem oluşturma', () => {
  it('"Her ay tekrarla": işlem ilk örnek olur, sabit kayıt aynı transaction’da oluşur', async () => {
    const ctx = ctxAt('2026-10-18');
    const result = await addTransaction(db, { ...(await expense()), date: '2026-10-05' }, ctx, { dayOfMonth: 5, endPeriod: '2027-05' });
    expect(result.generated).toBe(0);
    const r = await db.recurrings.get(result.recurringId!);
    expect(r).toMatchObject({ startDate: '2026-10-05', lastGeneratedPeriod: '2026-10', dayOfMonth: 5, endPeriod: '2027-05', active: true });
    expect(await db.transactions.get(result.id)).toMatchObject({ recurringId: r!.id, period: '2026-10' });
  });

  it('ilk örnek geçmiş bir aydaysa aradaki aylar hemen üretilir', async () => {
    const ctx = ctxAt('2026-10-18');
    const result = await addTransaction(db, { ...(await expense()), date: '2026-07-10' }, ctx, { dayOfMonth: 10 });
    expect(result.generated).toBe(3);
    const periods = (await db.transactions.where('recurringId').equals(result.recurringId!).toArray()).map((t) => t.period).sort();
    expect(periods).toEqual(['2026-07', '2026-08', '2026-09', '2026-10']);
  });

  it('bitiş ilk tekrardan önce olamaz', async () => {
    const ctx = ctxAt('2026-10-18');
    await expect(addTransaction(db, await expense(), ctx, { dayOfMonth: 18, endPeriod: '2026-10' }).catch(code)).resolves.toBe('invalidEnd');
    expect(await db.recurrings.count()).toBe(0);
    expect(await db.transactions.count()).toBe(0);
  });

  it('bağsız kayıt düzenlenirken tekrar açılırsa yeni sabit işlemin ilk örneği olur', async () => {
    const ctx = ctxAt('2026-10-18');
    const { id } = await addTransaction(db, await expense(), ctx);
    const result = await updateTransaction(db, id, await expense(), ctx, { dayOfMonth: 18 });
    expect(await db.transactions.get(id)).toMatchObject({ recurringId: result.recurringId, period: '2026-10' });
    await expect(updateTransaction(db, id, await expense(), ctx, { dayOfMonth: 18 }).catch(code)).resolves.toBe('alreadyRecurring');
  });
});

describe('üretim', () => {
  it('8 ay açılmayınca eksikler tek çalıştırmada üretilir; ikinci çalıştırma bir şey eklemez', async () => {
    const { recurringId } = await addTransaction(db, { ...(await expense()), date: '2026-02-01' }, ctxAt('2026-02-01'), { dayOfMonth: 1 });
    expect(await runGeneration(db, ctxAt('2026-10-19'))).toBe(8);
    expect(await runGeneration(db, ctxAt('2026-10-19'))).toBe(0);
    expect(await countRecurringInstances(db, recurringId!)).toBe(9);
    expect((await db.recurrings.get(recurringId!))?.lastGeneratedPeriod).toBe('2026-10');
  });

  it('üretilmiş kayıt silinip üretim tekrar çalışınca geri gelmez', async () => {
    const { recurringId } = await addTransaction(db, { ...(await expense()), date: '2026-09-01' }, ctxAt('2026-09-01'), { dayOfMonth: 1 });
    await runGeneration(db, ctxAt('2026-10-02'));
    const october = await db.transactions.where('[recurringId+period]').equals([recurringId!, '2026-10']).first();
    await deleteTransaction(db, october!.id);
    expect(await runGeneration(db, ctxAt('2026-10-03'))).toBe(0);
    expect(await countRecurringInstances(db, recurringId!)).toBe(1);
  });

  it('eşzamanlı iki çalıştırma mükerrer kayıt üretmez', async () => {
    const { recurringId } = await addTransaction(db, { ...(await expense()), date: '2026-01-01' }, ctxAt('2026-01-01'), { dayOfMonth: 1 });
    const ctx = ctxAt('2026-10-19');
    const [a, b] = await Promise.all([runGeneration(db, ctx), runGeneration(db, ctx)]);
    expect(a + b).toBe(9);
    expect(await countRecurringInstances(db, recurringId!)).toBe(10);
  });

  it('üretilmiş kaydı düzenlemek bağı korur, tarih başka aya taşınsa bile', async () => {
    const { recurringId } = await addTransaction(db, { ...(await expense()), date: '2026-09-01' }, ctxAt('2026-09-01'), { dayOfMonth: 1 });
    await runGeneration(db, ctxAt('2026-10-02'));
    const october = await db.transactions.where('[recurringId+period]').equals([recurringId!, '2026-10']).first();
    await updateTransaction(db, october!.id, { ...(await expense()), date: '2026-09-30', amount: 1 }, ctxAt('2026-10-02'));
    expect(await db.transactions.get(october!.id)).toMatchObject({ recurringId, period: '2026-10', date: '2026-09-30', amount: 1 });
    expect((await db.recurrings.get(recurringId!))?.amount).toBe(34000);
  });
});

describe('sabit işlem yaşam döngüsü', () => {
  async function monthly(start: string, day: number) {
    const { recurringId } = await addTransaction(db, { ...(await expense()), date: start }, ctxAt(start), { dayOfMonth: day });
    return recurringId!;
  }

  it('düzenleme yalnızca sonraki kayıtları etkiler', async () => {
    const id = await monthly('2026-09-01', 1);
    await runGeneration(db, ctxAt('2026-10-02'));
    await updateRecurring(db, id, { ...(await expense()), amount: 99900, dayOfMonth: 1 }, ctxAt('2026-10-02'));
    await runGeneration(db, ctxAt('2026-11-01'));
    const amounts = (await db.transactions.where('recurringId').equals(id).sortBy('period')).map((t) => t.amount);
    expect(amounts).toEqual([34000, 34000, 99900]);
  });

  it('bitti kayıt uzatılınca aradaki aylar doldurulmaz', async () => {
    const id = await monthly('2026-05-25', 25);
    await updateRecurring(db, id, { ...(await expense()), dayOfMonth: 25, endPeriod: '2026-06' }, ctxAt('2026-05-26'));
    // Uygulama Haziran–Ekim arası açılmadı; 19 Ekim'de bitiş uzatılıyor.
    await updateRecurring(db, id, { ...(await expense()), dayOfMonth: 25, endPeriod: '2027-06' }, ctxAt('2026-10-19'));
    const periods = (await db.transactions.where('recurringId').equals(id).toArray()).map((t) => t.period).sort();
    expect(periods).toEqual(['2026-05', '2026-06']);
    await runGeneration(db, ctxAt('2026-10-25'));
    expect((await db.transactions.where('recurringId').equals(id).toArray()).map((t) => t.period).sort()).toEqual([
      '2026-05', '2026-06', '2026-10',
    ]);
  });

  it('durdurulan kayıt üretmez; yeniden açılınca aradaki dönemler üretilmez', async () => {
    const id = await monthly('2026-05-05', 5);
    await setRecurringActive(db, id, false, ctxAt('2026-06-01'));
    expect(await runGeneration(db, ctxAt('2026-09-10'))).toBe(0);
    await setRecurringActive(db, id, true, ctxAt('2026-10-19'));
    expect(await countRecurringInstances(db, id)).toBe(1);
    expect(await runGeneration(db, ctxAt('2026-11-05'))).toBe(1);
  });

  it('silme bağları kaldırır; Geri al sabit kaydı ve bağları birebir geri getirir', async () => {
    const id = await monthly('2026-08-01', 1);
    await runGeneration(db, ctxAt('2026-10-02'));
    const before = await readAllData(db);
    const deleted = await deleteRecurring(db, id);
    expect(deleted.links).toHaveLength(3);
    expect(await db.recurrings.count()).toBe(0);
    const unlinked = await db.transactions.toArray();
    expect(unlinked).toHaveLength(3);
    expect(unlinked.every((t) => !('recurringId' in t) && !('period' in t))).toBe(true);
    await undoDeleteRecurring(db, deleted);
    expect(await readAllData(db)).toEqual(before);
  });
});

describe('kategoriler', () => {
  const ctx = ctxAt('2026-10-18');

  it('silinince işlemler ve sabit kayıtlar aynı türün Diğer kategorisine taşınır', async () => {
    const market = await categoryByName(db, 'expense', 'Market');
    const diger = await systemCategory(db, 'expense');
    await addTransaction(db, await expense(), ctx);
    await addTransaction(db, await expense(), ctx, { dayOfMonth: 18 });
    expect(await categoryUsage(db, market.id)).toEqual({ transactions: 2, recurrings: 1 });
    expect(await deleteCategory(db, market.id)).toEqual({ transactions: 2, recurrings: 1 });
    expect(await db.categories.get(market.id)).toBeUndefined();
    expect((await db.transactions.toArray()).every((t) => t.categoryId === diger.id)).toBe(true);
    expect((await db.recurrings.toArray()).every((r) => r.categoryId === diger.id)).toBe(true);
  });

  it('sistem kategorisi silinemez ama adı, rengi, ikonu değişebilir', async () => {
    const diger = await systemCategory(db, 'income');
    await expect(deleteCategory(db, diger.id).catch(code)).resolves.toBe('systemCategory');
    await updateCategory(db, diger.id, { name: 'Öteki', color: 'mor', icon: 'tag' });
    expect(await db.categories.get(diger.id)).toMatchObject({ name: 'Öteki', color: 'mor', icon: 'tag', isSystem: true, type: 'income' });
  });

  it('aynı türde aynı ad olamaz; diğer türde olabilir', async () => {
    await expect(addCategory(db, 'expense', { name: ' market ', color: 'mor', icon: 'tag' }, ctx).catch(code)).resolves.toBe('duplicateName');
    const id = await addCategory(db, 'income', { name: ' Market ', color: 'mor', icon: 'tag' }, ctx);
    expect(await db.categories.get(id)).toMatchObject({ name: 'Market', type: 'income', isSystem: false });
  });
});

describe('yedek ve geri yükleme', () => {
  const ctx = ctxAt('2026-10-18');

  it('yedek alınınca lastBackupAt güncellenir', async () => {
    expect(await getSettings(db)).toEqual({ id: 'app' });
    await markBackupTaken(db, 123);
    expect(await getSettings(db)).toEqual({ id: 'app', lastBackupAt: 123 });
  });

  it('başarısız geri yükleme mevcut veriyi değiştirmez', async () => {
    await addTransaction(db, await expense(), ctx);
    const before = await readAllData(db);
    const broken = buildBackup(structuredClone(before), new Date());
    broken.data.transactions.push({ ...broken.data.transactions[0]! }); // tekrarlı id: bulkAdd başarısız
    await expect(restoreBackup(db, broken, ctx)).rejects.toBeTruthy();
    expect(await readAllData(db)).toEqual(before);
  });

  it('geri yükleme veriyi tamamen değiştirir ve ardından üretim çalışır', async () => {
    await addTransaction(db, { ...(await expense()), date: '2026-07-01' }, ctxAt('2026-07-01'), { dayOfMonth: 1 });
    const backupText = serializeBackup(await createBackup(db, new Date()));
    await deleteAllData(db, ctx);
    await addTransaction(db, await expense(), ctx); // geri yüklemeyle silinecek
    const parsed = parseBackup(backupText);
    if (!parsed.ok) throw new Error('yedek geçersiz');
    const generated = await restoreBackup(db, parsed.backup, ctxAt('2026-10-18'));
    expect(generated).toBe(3);
    expect(await db.transactions.count()).toBe(4);
    expect(await db.categories.count()).toBe(14);
  });

  it('CSV tüm işlemleri içerir', async () => {
    await addTransaction(db, await expense(), ctx);
    expect(await exportCsv(db)).toContain('2026-10-18;Gider;Market;Migros;;-340,00');
  });

  it('tüm verileri sil varsayılanlara döner', async () => {
    await addTransaction(db, await expense(), ctx, { dayOfMonth: 18 });
    await markBackupTaken(db, 5);
    await deleteAllData(db, ctx);
    expect(await db.transactions.count()).toBe(0);
    expect(await db.recurrings.count()).toBe(0);
    expect(await db.categories.count()).toBe(14);
    expect(await getSettings(db)).toEqual({ id: 'app' });
  });
});
