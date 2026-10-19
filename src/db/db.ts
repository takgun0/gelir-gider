// Dexie şeması (Gereksinimler §4). Şema yalnızca yeni bir sürüm ve upgrade() ile değişir.
import Dexie, { type EntityTable } from 'dexie';
import { defaultCategoryRecords } from '../domain/categories';
import type { Category, Recurring, Settings, Transaction } from '../domain/types';

export const DB_NAME = 'gelir-gider';

export class AppDB extends Dexie {
  categories!: EntityTable<Category, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  recurrings!: EntityTable<Recurring, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(1).stores({
      categories: 'id, type',
      // recurringId/period yalnızca sabit işleme bağlı kayıtta yazılır; alanı olmayan
      // kayıt index'e girmez, bu yüzden unique index bağsız kayıtları engellemez.
      transactions: 'id, date, [type+date], categoryId, recurringId, &[recurringId+period]',
      recurrings: 'id, categoryId',
      settings: 'id',
    });
    // Varsayılan kategoriler yalnızca ilk açılışta bir kez yüklenir.
    this.on('populate', (tx) => {
      void tx.table('categories').bulkAdd(defaultCategoryRecords(Date.now(), () => crypto.randomUUID()));
    });
  }
}

export const db = new AppDB();
