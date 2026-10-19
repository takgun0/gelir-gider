import { describe, expect, it } from 'vitest';
import {
  generateDue,
  isEnded,
  isValidEndPeriod,
  lastPeriodOnReactivate,
  nextOccurrence,
  occurrenceDate,
  projectPlanned,
  repeatSummary,
} from './recurring';
import type { Recurring } from './types';

function rec(over: Partial<Recurring> = {}): Recurring {
  return {
    id: 'r1',
    type: 'expense',
    amount: 45000,
    categoryId: 'c-fatura',
    description: 'İnternet',
    note: '',
    dayOfMonth: 25,
    startDate: '2026-10-25',
    active: true,
    lastGeneratedPeriod: '2026-10',
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

const periods = (r: Recurring, today: string) => generateDue(r, today).drafts.map((d) => d.period);

describe('oluşma tarihi', () => {
  it('ayın 31i Şubatta 28/29una, Nisanda 30una düşer', () => {
    const r = { dayOfMonth: 31 };
    expect(occurrenceDate(r, '2026-02')).toBe('2026-02-28');
    expect(occurrenceDate(r, '2028-02')).toBe('2028-02-29');
    expect(occurrenceDate(r, '2026-04')).toBe('2026-04-30');
    expect(occurrenceDate(r, '2026-05')).toBe('2026-05-31');
  });
});

describe('generateDue', () => {
  it('ilk örnek bu aydaysa üretim sonraki aydan başlar', () => {
    const r = rec({ startDate: '2026-10-05', dayOfMonth: 5, lastGeneratedPeriod: '2026-10' });
    expect(periods(r, '2026-10-30')).toEqual([]);
    expect(periods(r, '2026-11-05')).toEqual(['2026-11']);
  });

  it('ilk örnek 3 ay önceyse aradaki 2 ay hemen üretilir', () => {
    const r = rec({ startDate: '2026-07-10', dayOfMonth: 10, lastGeneratedPeriod: '2026-07' });
    const result = generateDue(r, '2026-10-05');
    expect(result.drafts.map((d) => d.date)).toEqual(['2026-08-10', '2026-09-10']);
    expect(result.lastGeneratedPeriod).toBe('2026-09');
  });

  it('dayOfMonth 31 kısa aylarda ayın son gününde oluşur', () => {
    const r = rec({ dayOfMonth: 31, startDate: '2026-01-31', lastGeneratedPeriod: '2026-01' });
    expect(generateDue(r, '2026-05-01').drafts.map((d) => d.date)).toEqual(['2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('oluşma tarihi bugünden sonraysa üretmez ve dönemi işlenmiş saymaz', () => {
    const r = rec({ dayOfMonth: 25, lastGeneratedPeriod: '2026-09' });
    const result = generateDue(r, '2026-10-24');
    expect(result.drafts).toEqual([]);
    expect(result.lastGeneratedPeriod).toBe('2026-09');
    expect(periods(r, '2026-10-25')).toEqual(['2026-10']);
  });

  it('endPeriod dahildir, sonraki ay üretilmez ama işlenmiş sayılır', () => {
    const r = rec({ dayOfMonth: 1, startDate: '2026-06-01', lastGeneratedPeriod: '2026-06', endPeriod: '2026-08' });
    const result = generateDue(r, '2026-10-19');
    expect(result.drafts.map((d) => d.period)).toEqual(['2026-07', '2026-08']);
    expect(result.lastGeneratedPeriod).toBe('2026-10');
  });

  it('bitiş uzatılınca bu ayın henüz gelmemiş örneği kaybolmaz', () => {
    // Bitiş Eylül'dü; bugün 19 Ekim, oluşma 25 Ekim. Ekim işlenmiş sayılmamalı.
    const r = rec({ dayOfMonth: 25, lastGeneratedPeriod: '2026-09', endPeriod: '2026-09' });
    expect(generateDue(r, '2026-10-19').lastGeneratedPeriod).toBe('2026-09');
    const extended = { ...r, endPeriod: '2027-03' };
    expect(periods(extended, '2026-10-25')).toEqual(['2026-10']);
  });

  it('8 ay açılmayınca eksik dönemlerin hepsi tek çalıştırmada üretilir', () => {
    const r = rec({ dayOfMonth: 1, startDate: '2026-02-01', lastGeneratedPeriod: '2026-02' });
    expect(periods(r, '2026-10-19')).toEqual([
      '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10',
    ]);
  });

  it('aynı girdiyle ikinci çalıştırma yeni işlem üretmez', () => {
    const r = rec({ dayOfMonth: 1, startDate: '2026-07-01', lastGeneratedPeriod: '2026-07' });
    const first = generateDue(r, '2026-10-19');
    expect(first.drafts).toHaveLength(3);
    const second = generateDue({ ...r, lastGeneratedPeriod: first.lastGeneratedPeriod }, '2026-10-19');
    expect(second.drafts).toEqual([]);
    expect(second.lastGeneratedPeriod).toBe(first.lastGeneratedPeriod);
  });

  it('pasif kayıt işlem üretmez', () => {
    const r = rec({ dayOfMonth: 1, lastGeneratedPeriod: '2026-07', active: false });
    expect(generateDue(r, '2026-10-19')).toEqual({ drafts: [], lastGeneratedPeriod: '2026-07' });
  });

  it('Aralık → Ocak geçişi', () => {
    const r = rec({ dayOfMonth: 15, startDate: '2026-11-15', lastGeneratedPeriod: '2026-11' });
    expect(periods(r, '2027-01-20')).toEqual(['2026-12', '2027-01']);
  });

  it('kaydın güncel değerlerini kopyalar ve bağı yazar', () => {
    const r = rec({ dayOfMonth: 1, lastGeneratedPeriod: '2026-09', note: 'Not', amount: 999 });
    expect(generateDue(r, '2026-10-01').drafts).toEqual([
      {
        type: 'expense',
        amount: 999,
        categoryId: 'c-fatura',
        date: '2026-10-01',
        description: 'İnternet',
        note: 'Not',
        recurringId: 'r1',
        period: '2026-10',
      },
    ]);
  });
});

describe('yeniden aktife alma', () => {
  it('aradaki dönemler üretilmez', () => {
    const r = rec({ dayOfMonth: 5, lastGeneratedPeriod: '2026-06', active: false });
    const reactivated = { ...r, active: true, lastGeneratedPeriod: lastPeriodOnReactivate(r, '2026-10-19') };
    expect(reactivated.lastGeneratedPeriod).toBe('2026-10');
    expect(periods(reactivated, '2026-10-19')).toEqual([]);
    expect(periods(reactivated, '2026-11-05')).toEqual(['2026-11']);
  });

  it('bu ayın oluşma tarihi henüz gelmediyse bu ay üretilir', () => {
    const r = rec({ dayOfMonth: 25, lastGeneratedPeriod: '2026-06', active: false });
    const last = lastPeriodOnReactivate(r, '2026-10-19');
    expect(last).toBe('2026-09');
    expect(periods({ ...r, active: true, lastGeneratedPeriod: last }, '2026-10-25')).toEqual(['2026-10']);
  });

  it('bugünkü oluşma tarihi üretilir', () => {
    const r = rec({ dayOfMonth: 19, lastGeneratedPeriod: '2026-06', active: false });
    const last = lastPeriodOnReactivate(r, '2026-10-19');
    expect(periods({ ...r, active: true, lastGeneratedPeriod: last }, '2026-10-19')).toEqual(['2026-10']);
  });

  it('lastGeneratedPeriod geri gitmez', () => {
    const r = rec({ dayOfMonth: 25, lastGeneratedPeriod: '2026-10', active: false });
    expect(lastPeriodOnReactivate(r, '2026-10-19')).toBe('2026-10');
  });
});

describe('form ve liste yardımcıları', () => {
  it('ilk tekrar ve son', () => {
    expect(repeatSummary('2026-10-16', 16, '2027-05')).toEqual({ firstRepeat: '2026-11-16', lastPeriod: '2027-05' });
    expect(repeatSummary('2026-01-31', 31)).toEqual({ firstRepeat: '2026-02-28', lastPeriod: null });
  });

  it('bitiş ilk tekrardan önce olamaz, aynı ay olabilir', () => {
    expect(isValidEndPeriod('2026-10-16', '2026-10')).toBe(false);
    expect(isValidEndPeriod('2026-10-16', '2026-11')).toBe(true);
    expect(isValidEndPeriod('2026-12-01', '2027-01')).toBe(true);
  });

  it('Bitti durumu bitiş bu aydan önceyse', () => {
    expect(isEnded(rec({ endPeriod: '2026-09' }), '2026-10-19')).toBe(true);
    expect(isEnded(rec({ endPeriod: '2026-10' }), '2026-10-19')).toBe(false);
    expect(isEnded(rec(), '2026-10-19')).toBe(false);
  });

  it('sonraki oluşma tarihi', () => {
    expect(nextOccurrence(rec({ dayOfMonth: 25, lastGeneratedPeriod: '2026-09' }), '2026-10-18')).toBe('2026-10-25');
    expect(nextOccurrence(rec({ dayOfMonth: 1, lastGeneratedPeriod: '2026-10' }), '2026-10-18')).toBe('2026-11-01');
    expect(nextOccurrence(rec({ active: false }), '2026-10-18')).toBeNull();
    expect(nextOccurrence(rec({ lastGeneratedPeriod: '2026-10', endPeriod: '2026-10' }), '2026-10-30')).toBeNull();
  });
});

describe('projectPlanned', () => {
  const today = '2026-10-18';
  const internet = rec({ id: 'i', dayOfMonth: 25, lastGeneratedPeriod: '2026-09', startDate: '2026-05-25' });
  const kira = rec({ id: 'k', dayOfMonth: 1, lastGeneratedPeriod: '2026-10', startDate: '2026-01-01', amount: 750000 });
  const maas = rec({ id: 'm', type: 'income', dayOfMonth: 1, lastGeneratedPeriod: '2026-10', amount: 1800000 });
  const burs = rec({ id: 'b', type: 'income', dayOfMonth: 10, lastGeneratedPeriod: '2026-10', endPeriod: '2026-12' });
  const spor = rec({ id: 's', dayOfMonth: 28, lastGeneratedPeriod: '2026-09', active: false });
  const all = [internet, kira, maas, burs, spor];

  it('içinde bulunulan ay: yalnızca henüz gelmemiş örnekler', () => {
    expect(projectPlanned(all, '2026-10', today).map((p) => p.recurringId)).toEqual(['i']);
  });

  it('ilk örneği bu ay olan kayıt bu ay planlanan görünmez', () => {
    const yeni = rec({ id: 'y', dayOfMonth: 30, startDate: '2026-10-02', lastGeneratedPeriod: '2026-10' });
    expect(projectPlanned([yeni], '2026-10', today)).toEqual([]);
    expect(projectPlanned([yeni], '2026-11', today).map((p) => p.date)).toEqual(['2026-11-30']);
  });

  it('gelecek ay: aktif ve bitmemiş her kayıt, tarih sırasıyla', () => {
    const items = projectPlanned(all, '2026-11', today);
    expect(items.map((p) => [p.recurringId, p.date])).toEqual([
      ['k', '2026-11-01'],
      ['m', '2026-11-01'],
      ['b', '2026-11-10'],
      ['i', '2026-11-25'],
    ]);
  });

  it('bitişten sonraki ayda görünmez', () => {
    expect(projectPlanned(all, '2027-01', today).map((p) => p.recurringId)).not.toContain('b');
  });

  it('12 aylık sınır', () => {
    expect(projectPlanned(all, '2027-10', today)).toHaveLength(3);
    expect(projectPlanned(all, '2027-11', today)).toEqual([]);
  });

  it('geçmiş ay boş', () => {
    expect(projectPlanned(all, '2026-09', today)).toEqual([]);
  });
});
