import { describe, expect, it } from 'vitest';
import {
  MAX_FILE_BYTES,
  backupFileName,
  buildBackup,
  isFileTooLarge,
  parseBackup,
  serializeBackup,
  type BackupData,
} from './backup';
import type { Category, Recurring, Transaction } from './types';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const ID = {
  digerGider: uuid(1),
  digerGelir: uuid(2),
  market: uuid(3),
  maas: uuid(4),
  rec: uuid(5),
  tx1: uuid(6),
  tx2: uuid(7),
  tx3: uuid(8),
};

function category(over: Partial<Category> & Pick<Category, 'id' | 'name' | 'type'>): Category {
  return { color: 'arduvaz', icon: 'ellipsis', isSystem: false, createdAt: 1, ...over };
}

function fixture(): BackupData {
  const categories: Category[] = [
    category({ id: ID.digerGider, name: 'Diğer', type: 'expense', isSystem: true }),
    category({ id: ID.digerGelir, name: 'Diğer', type: 'income', isSystem: true }),
    category({ id: ID.market, name: 'Market', type: 'expense', color: 'turuncu', icon: 'shopping-cart' }),
    category({ id: ID.maas, name: 'Maaş', type: 'income', color: 'petrol', icon: 'banknote' }),
  ];
  const recurrings: Recurring[] = [
    {
      id: ID.rec,
      type: 'income',
      amount: 1800000,
      categoryId: ID.maas,
      description: 'Maaş',
      note: '',
      dayOfMonth: 1,
      startDate: '2025-03-01',
      active: true,
      lastGeneratedPeriod: '2026-10',
      endPeriod: '2027-12',
      createdAt: 1,
      updatedAt: 2,
    },
  ];
  const transactions: Transaction[] = [
    { id: ID.tx1, type: 'expense', amount: 34000, categoryId: ID.market, date: '2026-10-18', description: 'Migros', note: 'Satır 1\nSatır 2', createdAt: 1, updatedAt: 1 },
    { id: ID.tx2, type: 'income', amount: 1800000, categoryId: ID.maas, date: '2025-03-01', description: 'Maaş', note: '', recurringId: ID.rec, period: '2025-03', createdAt: 1, updatedAt: 1 },
    { id: ID.tx3, type: 'income', amount: 1800000, categoryId: ID.maas, date: '2026-10-01', description: 'Maaş', note: '', recurringId: ID.rec, period: '2026-10', createdAt: 1, updatedAt: 1 },
  ];
  return { categories, transactions, recurrings };
}

const now = new Date(2026, 9, 6, 14, 30);

function fileOf(data: BackupData = fixture()): Record<string, unknown> {
  return JSON.parse(serializeBackup(buildBackup(data, now))) as Record<string, unknown>;
}

function parseObj(obj: unknown) {
  return parseBackup(JSON.stringify(obj));
}

function mutate(change: (file: { data: BackupData } & Record<string, unknown>) => void) {
  const file = fileOf() as { data: BackupData } & Record<string, unknown>;
  change(file);
  return parseObj(file);
}

const rejected = { ok: false, error: 'invalid' };

describe('yedek oluşturma', () => {
  it('biçim ve dosya adı', () => {
    const file = buildBackup(fixture(), now);
    expect(file.app).toBe('gelir-gider');
    expect(file.formatVersion).toBe(1);
    expect(file.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(backupFileName('2026-10-18')).toBe('gelir-gider-yedek-2026-10-18.json');
  });
});

describe('kabul edilenler', () => {
  it('kendi dışa aktardığı dosya birebir geri gelir (round-trip)', () => {
    const data = fixture();
    const result = parseBackup(serializeBackup(buildBackup(data, now)));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.data).toEqual(data);
    const plain = result.backup.data.transactions[0];
    expect(plain && 'recurringId' in plain).toBe(false);
    expect(plain && 'period' in plain).toBe(false);
  });

  it('önizleme: sayılar, yedek tarihi ve kapsadığı aralık', () => {
    const result = parseBackup(serializeBackup(buildBackup(fixture(), now)));
    expect(result.ok && result.preview).toEqual({
      exportedDate: '2026-10-06',
      counts: { transactions: 3, categories: 4, recurrings: 1 },
      range: { from: '2025-03', to: '2026-10' },
    });
  });

  it('işlemsiz yedek', () => {
    const data = { ...fixture(), transactions: [], recurrings: [] };
    const result = parseObj(fileOf(data));
    expect(result.ok && result.preview.range).toBeNull();
  });
});

describe('reddedilenler', () => {
  it('bozuk JSON, yanlış app, JSON olmayan kök', () => {
    expect(parseBackup('{bozuk')).toEqual(rejected);
    expect(parseBackup('[]')).toEqual(rejected);
    expect(parseBackup('null')).toEqual(rejected);
    expect(mutate((f) => (f.app = 'baska-uygulama'))).toEqual(rejected);
  });

  it('daha yeni formatVersion ayrı hata verir', () => {
    expect(mutate((f) => (f.formatVersion = 2))).toEqual({ ok: false, error: 'newer' });
    expect(mutate((f) => (f.formatVersion = 0))).toEqual(rejected);
    expect(mutate((f) => (f.formatVersion = '1'))).toEqual(rejected);
  });

  it('eksik alan ve fazladan alan', () => {
    expect(mutate((f) => delete (f.data.transactions[0] as Partial<Transaction>).note)).toEqual(rejected);
    expect(mutate((f) => ((f.data.categories[0] as unknown as Record<string, unknown>).extra = 1))).toEqual(rejected);
    expect(mutate((f) => (f.extra = true))).toEqual(rejected);
    expect(mutate((f) => delete (f as Partial<typeof f>).exportedAt)).toEqual(rejected);
  });

  it.each([12.5, -100, 0, '100', 1e21, Number.MAX_SAFE_INTEGER, 100_000_000_000])('geçersiz tutar: %s', (amount) => {
    expect(mutate((f) => ((f.data.transactions[0] as unknown as Record<string, unknown>).amount = amount))).toEqual(rejected);
  });

  it('geçersiz tarih ve dönem', () => {
    expect(mutate((f) => (f.data.transactions[0]!.date = '2026-02-30'))).toEqual(rejected);
    expect(mutate((f) => (f.data.transactions[0]!.date = '18.10.2026'))).toEqual(rejected);
    expect(mutate((f) => (f.data.recurrings[0]!.lastGeneratedPeriod = '2026-13'))).toEqual(rejected);
    expect(mutate((f) => (f.exportedAt = 'dün'))).toEqual(rejected);
  });

  it('var olmayan kategori ya da tür uyuşmazlığı', () => {
    expect(mutate((f) => (f.data.transactions[0]!.categoryId = uuid(99)))).toEqual(rejected);
    expect(mutate((f) => (f.data.transactions[0]!.categoryId = ID.maas))).toEqual(rejected);
    expect(mutate((f) => (f.data.recurrings[0]!.categoryId = ID.market))).toEqual(rejected);
  });

  it('tekrarlı ID', () => {
    expect(mutate((f) => (f.data.transactions[1]!.id = ID.tx1))).toEqual(rejected);
    expect(mutate((f) => (f.data.categories[2]!.id = ID.digerGider))).toEqual(rejected);
  });

  it('sistem kategorisi her türde tam bir tane', () => {
    expect(mutate((f) => (f.data.categories[2]!.isSystem = true))).toEqual(rejected);
    expect(mutate((f) => (f.data.categories[1]!.isSystem = false))).toEqual(rejected);
  });

  it('aynı türde aynı adlı iki kategori', () => {
    expect(mutate((f) => (f.data.categories[2]!.name = 'DİĞER'))).toEqual(rejected);
  });

  it('sabit işlem bağı', () => {
    expect(mutate((f) => (f.data.transactions[2]!.period = '2025-03'))).toEqual(rejected);
    expect(mutate((f) => (f.data.transactions[2]!.recurringId = uuid(98)))).toEqual(rejected);
    expect(mutate((f) => delete f.data.transactions[2]!.period)).toEqual(rejected);
    expect(mutate((f) => (f.data.transactions[0]!.period = '2026-10'))).toEqual(rejected);
    expect(mutate((f) => ((f.data.transactions[0] as unknown as Record<string, unknown>).recurringId = ''))).toEqual(rejected);
  });

  it('__proto__ anahtarı', () => {
    const text = serializeBackup(buildBackup(fixture(), now));
    expect(parseBackup(text.replace('"app":', '"__proto__": {"x": 1}, "app":'))).toEqual(rejected);
    expect(parseBackup(text.replace('"name": "Market"', '"name": "Market", "__proto__": {}'))).toEqual(rejected);
  });

  it('palet dışı renk ya da katalogda olmayan ikon', () => {
    expect(mutate((f) => ((f.data.categories[2] as unknown as Record<string, unknown>).color = 'kirmizi'))).toEqual(rejected);
    expect(mutate((f) => ((f.data.categories[2] as unknown as Record<string, unknown>).icon = 'repeat'))).toEqual(rejected);
  });

  it('aşırı uzun string ve çok satırlı açıklama', () => {
    expect(mutate((f) => (f.data.categories[2]!.name = 'x'.repeat(25)))).toEqual(rejected);
    expect(mutate((f) => (f.data.categories[2]!.name = '   '))).toEqual(rejected);
    expect(mutate((f) => (f.data.transactions[0]!.description = 'x'.repeat(81)))).toEqual(rejected);
    expect(mutate((f) => (f.data.transactions[0]!.description = 'a\nb'))).toEqual(rejected);
    expect(mutate((f) => (f.data.transactions[0]!.note = 'x'.repeat(501)))).toEqual(rejected);
  });

  it('dayOfMonth aralığı ve id biçimi', () => {
    expect(mutate((f) => (f.data.recurrings[0]!.dayOfMonth = 32))).toEqual(rejected);
    expect(mutate((f) => (f.data.transactions[0]!.id = 'kisa'))).toEqual(rejected);
  });

  it('boyut sınırını aşan dosya', () => {
    expect(isFileTooLarge(MAX_FILE_BYTES + 1)).toBe(true);
    expect(isFileTooLarge(MAX_FILE_BYTES)).toBe(false);
    expect(parseBackup(' '.repeat(MAX_FILE_BYTES + 1))).toEqual({ ok: false, error: 'tooLarge' });
  });
});
