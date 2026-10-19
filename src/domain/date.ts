// Tüm tarih mantığı burada (SPEC §5.2). Tarihler yerel saatle "YYYY-MM-DD", dönemler
// "YYYY-MM" string'idir. new Date('YYYY-MM-DD'), toISOString ve Date.parse kullanılmaz.
import type { DateStr, Period } from './types';

/** "Bugün"ü okuyan saat; testlerde ve domain fonksiyonlarında dışarıdan verilir. */
export type Clock = () => Date;
export const systemClock: Clock = () => new Date();

export const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;

export const MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'] as const;

/** Pazartesi başlar (SPEC §5.2). */
export const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'] as const;
export const WEEKDAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const PERIOD_RE = /^(\d{4})-(\d{2})$/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pad4(n: number): string {
  return String(n).padStart(4, '0');
}

export interface DateParts {
  y: number;
  m: number;
  d: number;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

export function makeDate(y: number, m: number, d: number): DateStr {
  return `${pad4(y)}-${pad2(m)}-${pad2(d)}`;
}

export function makePeriod(y: number, m: number): Period {
  return `${pad4(y)}-${pad2(m)}`;
}

/** Takvimde geçerli değilse null (2026-02-30 geçersiz). */
export function parseDate(s: string): DateParts | null {
  const match = DATE_RE.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

export function parsePeriod(s: string): { y: number; m: number } | null {
  const match = PERIOD_RE.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12) return null;
  return { y, m };
}

export function isValidDate(s: string): boolean {
  return parseDate(s) !== null;
}

export function isValidPeriod(s: string): boolean {
  return parsePeriod(s) !== null;
}

function partsOf(date: DateStr): DateParts {
  const parts = parseDate(date);
  if (!parts) throw new Error(`Geçersiz tarih: ${date}`);
  return parts;
}

function periodPartsOf(period: Period): { y: number; m: number } {
  const parts = parsePeriod(period);
  if (!parts) throw new Error(`Geçersiz dönem: ${period}`);
  return parts;
}

/** Date nesnesinin yerel tarihini string'e çevirir. */
export function toDateStr(date: Date): DateStr {
  return makeDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Yerel gece yarısında Date nesnesi kurar. */
export function toLocalDate(date: DateStr): Date {
  const { y, m, d } = partsOf(date);
  return new Date(y, m - 1, d);
}

export function todayStr(clock: Clock = systemClock): DateStr {
  return toDateStr(clock());
}

export function periodOf(date: DateStr): Period {
  return date.slice(0, 7);
}

export function daysInPeriod(period: Period): number {
  const { y, m } = periodPartsOf(period);
  return daysInMonth(y, m);
}

export function addMonths(period: Period, n: number): Period {
  const { y, m } = periodPartsOf(period);
  const index = y * 12 + (m - 1) + n;
  return makePeriod(Math.floor(index / 12), (index % 12) + 1);
}

/** b − a, ay cinsinden. */
export function monthsBetween(a: Period, b: Period): number {
  const pa = periodPartsOf(a);
  const pb = periodPartsOf(b);
  return (pb.y - pa.y) * 12 + (pb.m - pa.m);
}

/** Dönemin ilk ve son günü (tarih aralığı sorguları için). */
export function periodRange(period: Period): { start: DateStr; end: DateStr } {
  const { y, m } = periodPartsOf(period);
  return { start: makeDate(y, m, 1), end: makeDate(y, m, daysInMonth(y, m)) };
}

/** Dönemin verilen günü; o ay daha kısaysa son gün (ayın 31'i Şubat'ta 28/29). */
export function clampDay(period: Period, day: number): DateStr {
  const { y, m } = periodPartsOf(period);
  return makeDate(y, m, Math.min(day, daysInMonth(y, m)));
}

export function dayOfMonth(date: DateStr): number {
  return partsOf(date).d;
}

/** Takvim günü farkı, b − a. Yaz saati geçişlerinden etkilenmez. */
export function diffDays(a: DateStr, b: DateStr): number {
  const pa = partsOf(a);
  const pb = partsOf(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86_400_000);
}

export function addDays(date: DateStr, n: number): DateStr {
  const { y, m, d } = partsOf(date);
  return toDateStr(new Date(y, m - 1, d + n));
}

/** 0 = Pazartesi … 6 = Pazar. */
export function weekdayIndex(date: DateStr): number {
  return (toLocalDate(date).getDay() + 6) % 7;
}

/** Tarihin içinde bulunduğu haftanın Pazartesi'si. */
export function startOfWeek(date: DateStr): DateStr {
  return addDays(date, -weekdayIndex(date));
}

// --- Etiketler (DESIGN §4) ---

/** "Ekim 2026" */
export function monthLabel(period: Period): string {
  const { y, m } = periodPartsOf(period);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "Ekim" */
export function monthName(period: Period): string {
  return MONTHS[periodPartsOf(period).m - 1] ?? '';
}

/** "Eki" */
export function monthShort(period: Period): string {
  return MONTHS_SHORT[periodPartsOf(period).m - 1] ?? '';
}

/** "16 Eki" — dar alanlar. */
export function shortDate(date: DateStr): string {
  const { m, d } = partsOf(date);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "16 Kasım" */
export function dayMonth(date: DateStr): string {
  const { m, d } = partsOf(date);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "6 Ekim 2026" */
export function fullDate(date: DateStr): string {
  const { y, m, d } = partsOf(date);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "16 Ekim Cuma"; bugünün yılından farklıysa "16 Ekim 2025 Perşembe". */
export function longDate(date: DateStr, today: DateStr): string {
  const { y, m, d } = partsOf(date);
  const weekday = WEEKDAYS[weekdayIndex(date)];
  const year = y === partsOf(today).y ? '' : ` ${y}`;
  return `${d} ${MONTHS[m - 1]}${year} ${weekday}`;
}

/** Liste grup başlığı: "Bugün", "Dün", "16 Ekim Cuma". */
export function dayHeading(date: DateStr, today: DateStr): string {
  if (date === today) return 'Bugün';
  if (date === addDays(today, -1)) return 'Dün';
  return longDate(date, today);
}

/** Takvim ızgarası: Pazartesi başlayan haftalar; ay dışındaki hücreler null. */
export function calendarWeeks(period: Period): (DateStr | null)[][] {
  const { y, m } = periodPartsOf(period);
  const first = makeDate(y, m, 1);
  const cells: (DateStr | null)[] = Array.from({ length: weekdayIndex(first) }, () => null);
  for (let d = 1; d <= daysInMonth(y, m); d++) cells.push(makeDate(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (DateStr | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
