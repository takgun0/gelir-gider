import { describe, expect, it } from 'vitest';
import { buildCsv, csvAmount, csvFileName } from './csv';
import type { Transaction } from './types';

const categories = new Map([
  ['m', { name: 'Market' }],
  ['e', { name: '=Ek gelir' }],
]);

function tx(over: Partial<Transaction>): Transaction {
  return {
    id: 'x',
    type: 'expense',
    amount: 125050,
    categoryId: 'm',
    date: '2026-10-18',
    description: 'Migros',
    note: '',
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

/** BOM'suz satırlar. */
function lines(csv: string): string[] {
  return csv.slice(1).split('\r\n');
}

describe('CSV biçimi', () => {
  it('BOM ile başlar, ; ayırıcı ve CRLF kullanır', () => {
    const csv = buildCsv([tx({})], categories);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines(csv)).toEqual(['Tarih;Tür;Kategori;Açıklama;Not;Tutar', '2026-10-18;Gider;Market;Migros;;-1250,50', '']);
    expect(csv.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });

  it('gelir pozitif, gider negatif; ondalık virgül, binlik ayırıcı yok', () => {
    expect(csvAmount(125050, 'expense')).toBe('-1250,50');
    expect(csvAmount(250000, 'income')).toBe('2500,00');
    expect(csvAmount(5, 'expense')).toBe('-0,05');
    expect(csvAmount(99_999_999_999, 'income')).toBe('999999999,99');
  });

  it('tarihe göre eskiden yeniye sıralar', () => {
    const csv = buildCsv(
      [tx({ date: '2026-10-18', description: 'b' }), tx({ date: '2026-01-02', description: 'a', type: 'income', amount: 100 })],
      categories,
    );
    expect(lines(csv).slice(1, 3)).toEqual(['2026-01-02;Gelir;Market;a;;1,00', '2026-10-18;Gider;Market;b;;-1250,50']);
  });

  it('dosya adı', () => {
    expect(csvFileName('2026-10-18')).toBe('para-yonetimi-islemler-2026-10-18.csv');
  });
});

describe('kaçış', () => {
  it('tırnak ve ; içeren alan tırnağa alınır, içteki tırnak ikilenir', () => {
    const csv = buildCsv([tx({ description: 'A;B "özel"' })], categories);
    expect(lines(csv)[1]).toBe('2026-10-18;Gider;Market;"A;B ""özel""";;-1250,50');
  });

  it('çok satırlı not tek hücrede kalır', () => {
    const csv = buildCsv([tx({ note: 'Satır 1\nSatır 2' })], categories);
    expect(csv).toContain(';"Satır 1\nSatır 2";-1250,50\r\n');
    expect(csv.slice(1).split('\r\n')).toHaveLength(3);
  });

  it.each([
    ['=1+1', "'=1+1"],
    ['+90 555 000 00 00', "'+90 555 000 00 00"],
    ['-x', "'-x"],
    ['@SUM(A1)', "'@SUM(A1)"],
    ['\tsekme', "'\tsekme"],
  ])('formül enjeksiyonu: %j', (description, expected) => {
    expect(lines(buildCsv([tx({ description })], categories))[1]).toBe(`2026-10-18;Gider;Market;${expected};;-1250,50`);
  });

  it('kategori adı ve not da kullanıcı girdisidir', () => {
    const csv = buildCsv([tx({ categoryId: 'e', type: 'income', amount: 100, note: '=HYPERLINK("x")' })], categories);
    expect(lines(csv)[1]).toBe(`2026-10-18;Gelir;'=Ek gelir;Migros;"'=HYPERLINK(""x"")";1,00`);
  });

  it('satır başıyla başlayan metin hem önek alır hem tırnaklanır', () => {
    expect(lines(buildCsv([tx({ note: '\rx' })], categories))[1]).toContain(`;"'\rx";`);
  });
});
