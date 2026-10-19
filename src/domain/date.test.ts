import { describe, expect, it } from 'vitest';
import {
  addDays,
  calendarWeeks,
  addMonths,
  clampDay,
  dayHeading,
  dayMonth,
  daysInPeriod,
  diffDays,
  fullDate,
  isValidDate,
  isValidPeriod,
  longDate,
  monthLabel,
  monthName,
  monthShort,
  monthsBetween,
  periodOf,
  periodRange,
  shortDate,
  startOfWeek,
  toDateStr,
  toLocalDate,
  todayStr,
  weekdayIndex,
} from './date';

describe('geçerlilik', () => {
  it('takvimde olmayan tarihleri reddeder', () => {
    expect(isValidDate('2026-10-19')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-1-01')).toBe(false);
    expect(isValidDate('2026-10-19T00:00')).toBe(false);
  });

  it('dönem biçimi', () => {
    expect(isValidPeriod('2026-10')).toBe(true);
    expect(isValidPeriod('2026-00')).toBe(false);
    expect(isValidPeriod('2026-10-01')).toBe(false);
  });
});

describe('yerel saat dönüşümleri', () => {
  it('gün sonuna yakın saatte de yerel günü verir', () => {
    expect(toDateStr(new Date(2026, 9, 19, 23, 59))).toBe('2026-10-19');
    expect(toDateStr(new Date(2026, 9, 19, 0, 0))).toBe('2026-10-19');
  });

  it('dışarıdan verilen saatle bugünü okur', () => {
    expect(todayStr(() => new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
  });

  it('string ile Date arasında gidip gelir', () => {
    expect(toDateStr(toLocalDate('2026-03-29'))).toBe('2026-03-29');
    expect(toDateStr(toLocalDate('2026-11-01'))).toBe('2026-11-01');
  });
});

describe('ay hesapları', () => {
  it('ay sonu ve artık yıl', () => {
    expect(daysInPeriod('2026-10')).toBe(31);
    expect(daysInPeriod('2026-04')).toBe(30);
    expect(daysInPeriod('2026-02')).toBe(28);
    expect(daysInPeriod('2028-02')).toBe(29);
    expect(periodRange('2028-02')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
  });

  it('ay ekleme, çıkarma ve yıl geçişi', () => {
    expect(addMonths('2026-10', 1)).toBe('2026-11');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-10', 12)).toBe('2027-10');
    expect(addMonths('2026-10', -22)).toBe('2024-12');
    expect(monthsBetween('2026-10', '2027-02')).toBe(4);
    expect(monthsBetween('2027-02', '2026-10')).toBe(-4);
  });

  it('ayın günü kısa ayda son güne çekilir', () => {
    expect(clampDay('2026-02', 31)).toBe('2026-02-28');
    expect(clampDay('2028-02', 31)).toBe('2028-02-29');
    expect(clampDay('2026-04', 31)).toBe('2026-04-30');
    expect(clampDay('2026-05', 31)).toBe('2026-05-31');
    expect(clampDay('2026-05', 1)).toBe('2026-05-01');
  });

  it('tarihin dönemi', () => {
    expect(periodOf('2026-10-19')).toBe('2026-10');
  });
});

describe('gün hesapları', () => {
  it('gün ekleme ay ve yıl sınırını aşar', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('yaz saati geçişinde gün farkı doğru', () => {
    // ABD'de 2026-03-08, AB'de 2026-03-29 yaz saati başlar.
    expect(diffDays('2026-03-07', '2026-03-09')).toBe(2);
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2);
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(diffDays('2026-10-18', '2026-10-25')).toBe(7);
  });

  it('hafta Pazartesi başlar', () => {
    expect(weekdayIndex('2026-10-19')).toBe(0); // Pazartesi
    expect(weekdayIndex('2026-10-18')).toBe(6); // Pazar
    expect(startOfWeek('2026-10-18')).toBe('2026-10-12');
    expect(startOfWeek('2026-10-19')).toBe('2026-10-19');
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26'); // ay sınırını aşar
  });
});

describe('etiketler', () => {
  const today = '2026-10-18';

  it('liste başlıkları: Bugün, Dün, tarih', () => {
    expect(dayHeading('2026-10-18', today)).toBe('Bugün');
    expect(dayHeading('2026-10-17', today)).toBe('Dün');
    expect(dayHeading('2026-10-16', today)).toBe('16 Ekim Cuma');
    expect(dayHeading('2026-10-12', today)).toBe('12 Ekim Pazartesi');
  });

  it('farklı yılda yıl eklenir', () => {
    expect(dayHeading('2025-10-16', today)).toBe('16 Ekim 2025 Perşembe');
    expect(dayHeading('2025-12-31', '2026-01-01')).toBe('Dün');
    expect(longDate('2025-12-30', '2026-01-01')).toBe('30 Aralık 2025 Salı');
  });

  it('ay seçici ve dar alan biçimleri', () => {
    expect(monthLabel('2026-10')).toBe('Ekim 2026');
    expect(monthName('2026-02')).toBe('Şubat');
    expect(monthShort('2026-08')).toBe('Ağu');
    expect(shortDate('2026-10-16')).toBe('16 Eki');
    expect(dayMonth('2026-11-01')).toBe('1 Kasım');
    expect(fullDate('2026-10-06')).toBe('6 Ekim 2026');
  });
});

describe('takvim ızgarası', () => {
  it('Pazartesi başlar, ay dışı hücreler boş', () => {
    // 1 Ekim 2026 Perşembe
    const weeks = calendarWeeks('2026-10');
    expect(weeks[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(weeks).toHaveLength(5);
    expect(weeks[4]).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', null]);
  });

  it('Pazartesi başlayan Şubat', () => {
    // 1 Şubat 2027 Pazartesi, 28 gün → tam 4 hafta
    expect(calendarWeeks('2027-02')).toHaveLength(4);
    expect(calendarWeeks('2027-02')[0]?.[0]).toBe('2027-02-01');
  });
});
