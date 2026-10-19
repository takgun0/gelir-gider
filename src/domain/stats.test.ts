import { describe, expect, it } from 'vitest';
import { projectPlanned } from './recurring';
import {
  categoryBreakdown,
  dailySeries,
  filterSummary,
  lastMonthsSeries,
  monthEndForecast,
  recurringTotals,
  sortByUsage,
  todayAndWeek,
  totals,
  totalsByCategory,
} from './stats';
import type { Recurring, Transaction, TxType } from './types';

function tx(date: string, amount: number, type: TxType = 'expense', categoryId = 'market'): Transaction {
  return { id: `${date}-${amount}`, type, amount, categoryId, date, description: '', note: '', createdAt: 0, updatedAt: 0 };
}

function rec(over: Partial<Recurring>): Recurring {
  return {
    id: 'r',
    type: 'expense',
    amount: 1000,
    categoryId: 'fatura',
    description: '',
    note: '',
    dayOfMonth: 1,
    startDate: '2026-01-01',
    active: true,
    lastGeneratedPeriod: '2026-10',
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

describe('aylık özet', () => {
  it('gelir, gider ve kalan', () => {
    expect(totals([tx('2026-10-01', 2050000, 'income'), tx('2026-10-02', 1460000)])).toEqual({
      income: 2050000,
      expense: 1460000,
      net: 590000,
    });
    expect(totals([])).toEqual({ income: 0, expense: 0, net: 0 });
  });
});

describe('bugün ve bu hafta', () => {
  it('yalnızca gideri sayar', () => {
    const r = todayAndWeek([tx('2026-10-18', 34000), tx('2026-10-18', 500000, 'income')], '2026-10-18');
    expect(r.today).toBe(34000);
  });

  it('hafta ay sınırını aştığında doğru hesaplanır', () => {
    // 1 Kasım 2026 Pazar; hafta 26 Ekim Pazartesi başlar.
    const txs = [tx('2026-10-25', 999), tx('2026-10-26', 1000), tx('2026-10-31', 2000), tx('2026-11-01', 300)];
    expect(todayAndWeek(txs, '2026-11-01')).toEqual({ today: 300, week: 3300 });
  });
});

describe('günlük seri ve ortalama', () => {
  const txs = [tx('2026-10-01', 1000), tx('2026-10-01', 500), tx('2026-10-05', 2000), tx('2026-10-05', 9999, 'income')];

  it('içinde bulunulan ay: bugüne kadarki gider / bugünün gün numarası', () => {
    const { days, average } = dailySeries(txs, '2026-10', '2026-10-10');
    expect(days).toHaveLength(31);
    expect(average).toBe(350); // 3500 / 10
    expect(days[0]).toMatchObject({ day: 1, expense: 1500, count: 2, isMonday: false });
    expect(days[4]).toMatchObject({ day: 5, expense: 2000, count: 1, isMonday: true });
    expect(days[9]).toMatchObject({ isToday: true, isFuture: false });
    expect(days[10]).toMatchObject({ isFuture: true });
  });

  it('geçmiş ay: toplam gider / ayın gün sayısı', () => {
    const { average } = dailySeries(txs, '2026-10', '2026-11-03');
    expect(average).toBe(113); // 3500 / 31 = 112,9
    expect(dailySeries([tx('2026-02-03', 2800)], '2026-02', '2026-10-01').average).toBe(100);
  });

  it('gelecek ay boş', () => {
    expect(dailySeries(txs, '2026-11', '2026-10-10')).toEqual({ days: [], average: null });
  });

  it('başka ayın işlemlerini saymaz', () => {
    const { days } = dailySeries([tx('2026-09-30', 700)], '2026-10', '2026-10-10');
    expect(days.every((d) => d.expense === 0)).toBe(true);
  });
});

describe('kategori dağılımı', () => {
  const names: Record<string, string> = { a: 'Kira', b: 'Market', c: 'Faturalar', d: 'Yemek', e: 'Ulaşım', f: 'Abonelikler', g: 'Eğlence', h: 'Sağlık', i: 'Eğitim' };
  const nameOf = (id: string) => names[id] ?? id;
  const amounts: [string, number][] = [['a', 7500], ['b', 2840], ['c', 1260], ['d', 1180], ['e', 640], ['f', 420], ['g', 380], ['h', 250], ['i', 130]];
  const txs = amounts.map(([id, amount]) => tx('2026-10-01', amount, 'expense', id));

  it('ilk 6 kategori ve Diğerleri (n)', () => {
    const r = categoryBreakdown([...txs, tx('2026-10-02', 5, 'income', 'maas')], 'expense', nameOf);
    expect(r.total).toBe(14600);
    expect(r.slices.map((s) => s.categoryId)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(r.others).toEqual({ count: 3, amount: 760, ratio: 760 / 14600, categoryIds: ['g', 'h', 'i'] });
    expect(r.slices[0]?.ratio).toBeCloseTo(7500 / 14600);
  });

  it('6 ya da daha az kategoride Diğerleri yok', () => {
    expect(categoryBreakdown(txs.slice(0, 6), 'expense', nameOf).others).toBeNull();
    expect(categoryBreakdown([], 'expense', nameOf)).toEqual({ total: 0, slices: [], others: null });
  });

  it('eşit tutarda Türkçe alfabeye göre sıralar', () => {
    const r = categoryBreakdown([tx('2026-10-01', 10, 'expense', 'g'), tx('2026-10-01', 10, 'expense', 'c')], 'expense', nameOf);
    expect(r.slices.map((s) => s.categoryId)).toEqual(['g', 'c']); // Eğlence < Faturalar
  });
});

describe('son 6 ay', () => {
  it('seçili ay dahil geriye 6 ay, yıl geçişiyle', () => {
    const series = lastMonthsSeries([tx('2026-01-05', 100), tx('2025-09-01', 50, 'income'), tx('2025-08-31', 1)], '2026-01');
    expect(series.map((m) => m.period)).toEqual(['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01']);
    expect(series[0]).toEqual({ period: '2025-08', income: 0, expense: 1, hasData: true });
    expect(series[1]).toEqual({ period: '2025-09', income: 50, expense: 0, hasData: true });
    expect(series[2]?.hasData).toBe(false);
  });
});

describe('planlanan örnekler', () => {
  const today = '2026-10-18';
  const recurrings = [
    rec({ id: 'i', dayOfMonth: 25, amount: 45000, lastGeneratedPeriod: '2026-09' }),
    rec({ id: 't', dayOfMonth: 30, amount: 35000, lastGeneratedPeriod: '2026-09' }),
    rec({ id: 'b', type: 'income', dayOfMonth: 28, amount: 10000, lastGeneratedPeriod: '2026-09' }),
  ];

  it('toplamlara girmez', () => {
    const actual = [tx('2026-10-01', 2050000, 'income'), tx('2026-10-02', 1460000)];
    expect(totals(actual).net).toBe(590000);
    expect(projectPlanned(recurrings, '2026-10', today)).toHaveLength(3);
    expect(dailySeries(actual, '2026-10', today).days.reduce((s, d) => s + d.expense, 0)).toBe(1460000);
  });

  it('ay sonu tahmini = gerçekleşmiş net + planlanan gelir − planlanan gider', () => {
    const planned = projectPlanned(recurrings, '2026-10', today);
    expect(monthEndForecast(590000, planned)).toBe(590000 + 10000 - 45000 - 35000);
    expect(monthEndForecast(-184000, [])).toBe(-184000);
  });
});

describe('diğer özetler', () => {
  it('sabit işlem özeti yalnızca aktif ve bitmemişlerden', () => {
    const today = '2026-10-18';
    const list = [
      rec({ type: 'income', amount: 1800000 }),
      rec({ amount: 750000 }),
      rec({ amount: 60000, active: false }),
      rec({ type: 'income', amount: 300000, endPeriod: '2026-06' }),
      rec({ amount: 100, endPeriod: '2026-10' }),
    ];
    expect(recurringTotals(list, today)).toEqual({ income: 1800000, expense: 750100 });
  });

  it('filtre özeti işaretli net verir', () => {
    expect(filterSummary([tx('2026-10-01', 1000), tx('2026-10-02', 300, 'income')])).toEqual({ count: 2, net: -700 });
  });

  it('kategoriler ekranı sıralaması', () => {
    const cats = [
      { id: 'e', name: 'Eğitim' },
      { id: 'k', name: 'Kira' },
      { id: 'm', name: 'Market' },
      { id: 'a', name: 'Abonelikler' },
    ];
    const sums = totalsByCategory([tx('2026-10-01', 100, 'expense', 'm'), tx('2026-10-01', 900, 'expense', 'k')]);
    expect(sortByUsage(cats, sums).map((c) => c.name)).toEqual(['Kira', 'Market', 'Abonelikler', 'Eğitim']);
  });
});
