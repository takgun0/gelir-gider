import { describe, expect, it } from 'vitest';
import type { Transaction, TxType } from '../../domain/types';
import { NO_FILTERS, applyFilters, groupByDay, groupByMonth, isFiltered, rowTitle, searchTransactions } from './list';

let n = 0;
function tx(date: string, amount: number, type: TxType = 'expense', over: Partial<Transaction> = {}): Transaction {
  n++;
  return { id: `t${n}`, type, amount, categoryId: 'market', date, description: '', note: '', createdAt: n, updatedAt: n, ...over };
}

const categories = new Map([
  ['market', { name: 'Market' }],
  ['ilik', { name: 'ILIK' }],
]);

describe('filtre', () => {
  const txs = [tx('2026-10-01', 1), tx('2026-10-02', 2, 'income'), tx('2026-10-03', 3, 'expense', { categoryId: 'ilik' })];

  it('tür ve kategori', () => {
    expect(isFiltered(NO_FILTERS)).toBe(false);
    expect(applyFilters(txs, { type: 'income', categoryIds: new Set() })).toHaveLength(1);
    expect(applyFilters(txs, { type: 'expense', categoryIds: new Set(['ilik']) }).map((t) => t.amount)).toEqual([3]);
    expect(applyFilters(txs, { type: 'all', categoryIds: new Set(['market']) })).toHaveLength(2);
  });
});

describe('arama', () => {
  it('açıklama, not ve kategori adında tr-TR kurallarıyla', () => {
    const txs = [
      tx('2026-10-01', 1, 'expense', { description: 'Migros Jet' }),
      tx('2026-10-01', 2, 'expense', { note: 'Ilık süt aldım' }),
      tx('2026-10-01', 3, 'expense', { categoryId: 'ilik' }),
      tx('2026-10-01', 4),
    ];
    expect(searchTransactions(txs, 'MİGROS', categories).map((t) => t.amount)).toEqual([1]);
    expect(searchTransactions(txs, 'ılık', categories).map((t) => t.amount)).toEqual([2, 3]);
    expect(searchTransactions(txs, '  ', categories)).toHaveLength(4);
  });
});

describe('gruplama', () => {
  it('günlere göre, yeniden eskiye, günün işaretli neti', () => {
    const a = tx('2026-10-12', 250000, 'income');
    const b = tx('2026-10-12', 28500);
    const c = tx('2026-10-18', 34000);
    const groups = groupByDay([a, b, c]);
    expect(groups.map((g) => g.date)).toEqual(['2026-10-18', '2026-10-12']);
    expect(groups[1]?.net).toBe(221500);
    expect(groups[1]?.items.map((t) => t.id)).toEqual([b.id, a.id]);
  });

  it('arama sonuçları ay başlıklarıyla', () => {
    const groups = groupByMonth([tx('2026-08-30', 1), tx('2026-10-02', 2), tx('2026-10-18', 3)]);
    expect(groups.map((g) => [g.period, g.items.length])).toEqual([
      ['2026-10', 2],
      ['2026-08', 1],
    ]);
  });

  it('satır başlığı: açıklama yoksa kategori adı', () => {
    expect(rowTitle({ description: 'Migros' }, { name: 'Market' })).toBe('Migros');
    expect(rowTitle({ description: '' }, { name: 'Market' })).toBe('Market');
  });
});
