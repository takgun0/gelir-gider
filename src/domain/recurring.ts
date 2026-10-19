// Sabit işlem kuralları (SPEC §5.3, DESIGN §7). Saf fonksiyonlar; DB katmanı bunları
// transaction içinde uygular.
import { addMonths, clampDay, monthsBetween, periodOf } from './date';
import type { DateStr, Period, Recurring, Transaction } from './types';

/** Gelecekte en fazla kaç ay ileri planlanan gösterilir (DESIGN §5). */
export const MAX_MONTHS_AHEAD = 12;

type Schedule = Pick<Recurring, 'dayOfMonth'>;

/** P dönemindeki oluşma tarihi: min(dayOfMonth, ayın gün sayısı). */
export function occurrenceDate(r: Schedule, period: Period): DateStr {
  return clampDay(period, r.dayOfMonth);
}

/** İlk tekrarın dönemi: ilk örneğin ayından bir sonraki ay. */
export function firstRepeatPeriod(startDate: DateStr): Period {
  return addMonths(periodOf(startDate), 1);
}

/** Formdaki "İlk tekrar · Son" özeti; üretimle aynı kurallar. */
export function repeatSummary(
  startDate: DateStr,
  dayOfMonth: number,
  endPeriod?: Period,
): { firstRepeat: DateStr; lastPeriod: Period | null } {
  return {
    firstRepeat: occurrenceDate({ dayOfMonth }, firstRepeatPeriod(startDate)),
    lastPeriod: endPeriod ?? null,
  };
}

/** Bitiş ayı ilk tekrarın ayından önce olamaz; aynı ay olabilir. */
export function isValidEndPeriod(startDate: DateStr, endPeriod: Period): boolean {
  return endPeriod >= firstRepeatPeriod(startDate);
}

/** Bitiş ayı bu aydan önceyse kayıt "Bitti" görünür ve anahtarı olmaz. */
export function isEnded(r: Pick<Recurring, 'endPeriod'>, today: DateStr): boolean {
  return r.endPeriod !== undefined && r.endPeriod < periodOf(today);
}

/** Üretilecek işlem; id ve zaman damgalarını DB katmanı ekler. */
export type TransactionDraft = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & {
  recurringId: string;
  period: Period;
};

export function instanceDraft(r: Recurring, period: Period): TransactionDraft {
  return {
    type: r.type,
    amount: r.amount,
    categoryId: r.categoryId,
    date: occurrenceDate(r, period),
    description: r.description,
    note: r.note,
    recurringId: r.id,
    period,
  };
}

/**
 * lastGeneratedPeriod'dan sonraki aydan bugünün ayına kadar her dönemi sırayla işler:
 * 1. Oluşma tarihi bugünden sonraysa durur; dönem işlenmiş sayılmaz.
 * 2. Dönem bitişten sonraysa işlem üretmez ama dönemi işlenmiş sayar.
 * 3. Diğer durumlarda kaydın güncel değerleriyle bir işlem üretir.
 */
export function generateDue(
  r: Recurring,
  today: DateStr,
): { drafts: TransactionDraft[]; lastGeneratedPeriod: Period } {
  let last = r.lastGeneratedPeriod;
  const drafts: TransactionDraft[] = [];
  if (!r.active) return { drafts, lastGeneratedPeriod: last };

  const current = periodOf(today);
  for (let p = addMonths(last, 1); p <= current; p = addMonths(p, 1)) {
    if (occurrenceDate(r, p) > today) break;
    if (r.endPeriod === undefined || p <= r.endPeriod) drafts.push(instanceDraft(r, p));
    last = p;
  }
  return { drafts, lastGeneratedPeriod: last };
}

/**
 * Yeniden aktife alınan kayıt: aktife alındığı günden önceki oluşma tarihleri için
 * işlem üretilmez. Bugünkü oluşma tarihi "önce" sayılmaz, üretilir.
 */
export function lastPeriodOnReactivate(r: Recurring, today: DateStr): Period {
  const current = periodOf(today);
  const skipped = occurrenceDate(r, current) < today ? current : addMonths(current, -1);
  return skipped > r.lastGeneratedPeriod ? skipped : r.lastGeneratedPeriod;
}

/** "Sonraki: 1 Kasım". Pasif ya da bitmiş kayıtta null. */
export function nextOccurrence(r: Recurring, today: DateStr): DateStr | null {
  if (!r.active || isEnded(r, today)) return null;
  const next = addMonths(r.lastGeneratedPeriod, 1);
  if (r.endPeriod !== undefined && next > r.endPeriod) return null;
  return occurrenceDate(r, next);
}

export interface PlannedItem {
  recurringId: string;
  type: Recurring['type'];
  amount: number;
  categoryId: string;
  description: string;
  note: string;
  date: DateStr;
  period: Period;
}

/**
 * Seçili ayın planlanan örnekleri; veritabanına yazılmaz, toplamlara girmez.
 * - İçinde bulunulan ay: dönemi lastGeneratedPeriod'dan sonra, oluşma tarihi bugünden
 *   sonra ve bitişi geçmemiş aktif kayıtlar.
 * - Gelecek aylar (en fazla 12): o ayda aktif ve bitmemiş her kayıt.
 * - Geçmiş aylar: boş.
 */
export function projectPlanned(recurrings: readonly Recurring[], period: Period, today: DateStr): PlannedItem[] {
  const current = periodOf(today);
  const ahead = monthsBetween(current, period);
  if (ahead < 0 || ahead > MAX_MONTHS_AHEAD) return [];

  const items: PlannedItem[] = [];
  for (const r of recurrings) {
    if (!r.active) continue;
    if (r.endPeriod !== undefined && period > r.endPeriod) continue;
    if (period <= r.lastGeneratedPeriod) continue;
    const date = occurrenceDate(r, period);
    if (ahead === 0 && date <= today) continue;
    items.push({
      recurringId: r.id,
      type: r.type,
      amount: r.amount,
      categoryId: r.categoryId,
      description: r.description,
      note: r.note,
      date,
      period,
    });
  }
  return items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
