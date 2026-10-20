import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AppDB } from './db';
import { AppDB as AppDBClass } from './db';
import { DbError } from './errors';
import { deleteAllData, readAllData } from './ops/data';
import { addDebt, deleteDebt, restoreDebt, setDebtPaid, updateDebt } from './ops/debts';
import { ctxAt, openTestDb } from './testing';

let db: AppDB;
const ctx = ctxAt('2026-10-20');
const input = {
  direction: 'payable' as const,
  amount: 50000,
  person: '  Ahmet  ',
  date: '2026-10-01',
  dueDate: '2026-11-15',
  description: 'Kira payı',
  note: '',
};
const code = (e: unknown) => (e instanceof DbError ? e.code : e);

beforeEach(async () => {
  db = await openTestDb();
});

afterEach(async () => {
  await db.delete();
});

describe('borç ve alacak', () => {
  it('eklenir; kişi adı kırpılır, açıkken paidOn yazılmaz', async () => {
    const id = await addDebt(db, input, ctx);
    const saved = await db.debts.get(id);
    expect(saved).toMatchObject({ person: 'Ahmet', amount: 50000, dueDate: '2026-11-15' });
    expect(saved && 'paidOn' in saved).toBe(false);
  });

  it('vadesiz kayıtta dueDate alanı hiç yazılmaz', async () => {
    const { dueDate: _d, ...rest } = input;
    const saved = await db.debts.get(await addDebt(db, rest, ctx));
    expect(saved && 'dueDate' in saved).toBe(false);
  });

  it('geçersiz girdi reddedilir', async () => {
    await expect(addDebt(db, { ...input, person: '  ' }, ctx).catch(code)).resolves.toBe('invalidText');
    await expect(addDebt(db, { ...input, amount: 0 }, ctx).catch(code)).resolves.toBe('invalidAmount');
    await expect(addDebt(db, { ...input, date: '2026-10-21' }, ctx).catch(code)).resolves.toBe('futureDate');
    expect(await db.debts.count()).toBe(0);
  });

  it('ödendi işaretlenir, geri alınır, düzenlemede ödeme korunur', async () => {
    const id = await addDebt(db, input, ctx);
    const before = await setDebtPaid(db, id, '2026-10-20', ctx);
    expect((await db.debts.get(id))?.paidOn).toBe('2026-10-20');
    await updateDebt(db, id, { ...input, amount: 60000 }, ctx);
    expect(await db.debts.get(id)).toMatchObject({ amount: 60000, paidOn: '2026-10-20' });
    await setDebtPaid(db, id, null, ctx);
    const reopened = await db.debts.get(id);
    expect(reopened && 'paidOn' in reopened).toBe(false);
    await restoreDebt(db, before);
    expect(await db.debts.get(id)).toEqual(before);
  });

  it('silme ve geri al', async () => {
    const id = await addDebt(db, input, ctx);
    const removed = await deleteDebt(db, id);
    expect(await db.debts.count()).toBe(0);
    await restoreDebt(db, removed!);
    expect(await db.debts.get(id)).toEqual(removed);
  });

  it('yedeğe girer, tüm verileri sil temizler', async () => {
    await addDebt(db, input, ctx);
    expect((await readAllData(db)).debts).toHaveLength(1);
    await deleteAllData(db, ctx);
    expect(await db.debts.count()).toBe(0);
  });
});

describe('sürüm yükseltme', () => {
  it('sürüm 1 veritabanı açılınca veriler korunur ve borç tablosu eklenir', async () => {
    const name = `v1-${crypto.randomUUID()}`;
    const v1 = new Dexie(name);
    v1.version(1).stores({
      categories: 'id, type',
      transactions: 'id, date, [type+date], categoryId, recurringId, &[recurringId+period]',
      recurrings: 'id, categoryId',
      settings: 'id',
    });
    await v1.open();
    await v1.table('settings').put({ id: 'app', lastBackupAt: 7 });
    v1.close();

    const upgraded = new AppDBClass(name);
    await upgraded.open();
    expect(upgraded.verno).toBe(2);
    expect(await upgraded.settings.get('app')).toEqual({ id: 'app', lastBackupAt: 7 });
    expect(await upgraded.debts.count()).toBe(0);
    await upgraded.delete();
  });
});
