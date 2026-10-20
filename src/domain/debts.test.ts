import { describe, expect, it } from 'vitest';
import { daysOverdue, debtStatus, groupDebts, openTotals, signedDebt } from './debts';
import type { Debt } from './types';

let n = 0;
function debt(over: Partial<Debt>): Debt {
  n++;
  return {
    id: `d${n}`,
    direction: 'payable',
    amount: 10000,
    person: 'Ali',
    date: '2026-10-01',
    description: '',
    note: '',
    createdAt: n,
    updatedAt: n,
    ...over,
  };
}

describe('borç durumu', () => {
  const today = '2026-10-20';

  it('ödendi, vadesi geçti, bugün, açık', () => {
    expect(debtStatus({ paidOn: '2026-10-10', dueDate: '2026-10-01' }, today)).toBe('paid');
    expect(debtStatus({ dueDate: '2026-10-19' }, today)).toBe('overdue');
    expect(debtStatus({ dueDate: today }, today)).toBe('dueToday');
    expect(debtStatus({ dueDate: '2026-11-01' }, today)).toBe('open');
    expect(debtStatus({}, today)).toBe('open');
  });

  it('gecikme günü', () => {
    expect(daysOverdue({ dueDate: '2026-10-17' }, today)).toBe(3);
    expect(daysOverdue({ dueDate: '2026-10-25' }, today)).toBe(0);
    expect(daysOverdue({ dueDate: '2026-10-17', paidOn: today }, today)).toBe(0);
  });
});

describe('toplamlar ve gruplama', () => {
  const list = [
    debt({ direction: 'payable', amount: 50000, dueDate: '2026-11-01' }),
    debt({ direction: 'payable', amount: 20000, dueDate: '2026-10-05' }),
    debt({ direction: 'payable', amount: 7000 }),
    debt({ direction: 'receivable', amount: 30000 }),
    debt({ direction: 'receivable', amount: 99999, paidOn: '2026-10-15' }),
    debt({ direction: 'payable', amount: 1, paidOn: '2026-10-18' }),
  ];

  it('yalnızca açık kayıtlar toplanır', () => {
    expect(openTotals(list)).toEqual({ payable: 77000, receivable: 30000, payableCount: 3, receivableCount: 1 });
  });

  it('açıklar vadeye göre (vadesizler sonda), kapananlar en son ödenen önce', () => {
    const g = groupDebts(list);
    expect(g.payable.map((d) => d.amount)).toEqual([20000, 50000, 7000]);
    expect(g.receivable.map((d) => d.amount)).toEqual([30000]);
    expect(g.paid.map((d) => d.paidOn)).toEqual(['2026-10-18', '2026-10-15']);
  });

  it('borç eksi, alacak artı', () => {
    expect(signedDebt({ direction: 'payable', amount: 5 })).toBe(-5);
    expect(signedDebt({ direction: 'receivable', amount: 5 })).toBe(5);
  });
});
