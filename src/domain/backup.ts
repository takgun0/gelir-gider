// JSON yedeği ve geri yükleme doğrulaması (SPEC §5.5). Dosya veritabanına yazılmadan
// önce baştan sona doğrulanır; DB'ye ham JSON değil zod'un çıktısı yazılır.
import { z } from 'zod';
import { isValidDate, isValidPeriod, periodOf, toDateStr } from './date';
import { MAX_AMOUNT } from './money';
import { categoryNameKey } from './text';
import { ICON_KEYS, PALETTE_KEYS, type Category, type DateStr, type Period, type Recurring, type Transaction } from './types';

export const APP_ID = 'gelir-gider';
export const FORMAT_VERSION = 1;
/** 10 MB */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Tablo başına kayıt sınırı. */
export const MAX_RECORDS = 100_000;

export interface BackupData {
  categories: Category[];
  transactions: Transaction[];
  recurrings: Recurring[];
}

export interface BackupFile {
  app: typeof APP_ID;
  formatVersion: typeof FORMAT_VERSION;
  /** ISO-8601 zaman damgası */
  exportedAt: string;
  data: BackupData;
}

export function buildBackup(data: BackupData, now: Date): BackupFile {
  return {
    app: APP_ID,
    formatVersion: FORMAT_VERSION,
    // Bir tarih string'i değil, ISO-8601 zaman damgası (SPEC §5.5 biçimi).
    // eslint-disable-next-line no-restricted-properties
    exportedAt: now.toISOString(),
    data,
  };
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(today: DateStr): string {
  return `gelir-gider-yedek-${today}.json`;
}

// --- Şemalar ---

const id = z.uuid();
const timestamp = z.int().nonnegative();
const dateStr = z.string().refine(isValidDate);
const periodStr = z.string().refine(isValidPeriod);
const txType = z.enum(['income', 'expense']);
const amount = z.int().min(1).max(MAX_AMOUNT);
const singleLine = (max: number) => z.string().max(max).refine((s) => !/[\r\n]/.test(s));

const categorySchema = z.strictObject({
  id,
  name: z.string().max(24).refine((s) => s.trim().length >= 1),
  type: txType,
  color: z.enum(PALETTE_KEYS),
  icon: z.enum(ICON_KEYS),
  isSystem: z.boolean(),
  createdAt: timestamp,
});

const transactionSchema = z
  .strictObject({
    id,
    type: txType,
    amount,
    categoryId: id,
    date: dateStr,
    description: singleLine(80),
    note: z.string().max(500),
    recurringId: id.optional(),
    period: periodStr.optional(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .refine((t) => (t.recurringId === undefined) === (t.period === undefined));

const recurringSchema = z.strictObject({
  id,
  type: txType,
  amount,
  categoryId: id,
  description: singleLine(80),
  note: z.string().max(500),
  dayOfMonth: z.int().min(1).max(31),
  startDate: dateStr,
  endPeriod: periodStr.optional(),
  active: z.boolean(),
  lastGeneratedPeriod: periodStr,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const backupSchema = z.strictObject({
  app: z.literal(APP_ID),
  formatVersion: z.literal(FORMAT_VERSION),
  exportedAt: z.iso.datetime(),
  data: z.strictObject({
    categories: z.array(categorySchema).max(MAX_RECORDS),
    transactions: z.array(transactionSchema).max(MAX_RECORDS),
    recurrings: z.array(recurringSchema).max(MAX_RECORDS),
  }),
});

// --- Doğrulama ---

export type RestoreError = 'invalid' | 'newer' | 'tooLarge';

export interface RestorePreview {
  /** Yedeğin alındığı yerel gün */
  exportedDate: DateStr;
  counts: { transactions: number; categories: number; recurrings: number };
  /** İşlemlerin kapsadığı aralık; işlem yoksa null. */
  range: { from: Period; to: Period } | null;
}

export type RestoreResult =
  | { ok: true; backup: BackupFile; preview: RestorePreview }
  | { ok: false; error: RestoreError };

/** Dosya okunmadan önce boyut kontrolü. */
export function isFileTooLarge(bytes: number): boolean {
  return bytes > MAX_FILE_BYTES;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Eski biçim sürümlerini güncel sürüme taşır. Şu an yalnızca sürüm 1 var; yeni bir
 * sürüm eklendiğinde buraya bir adım eklenir.
 */
export function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  return raw;
}

function hasIntegrity(data: BackupData): boolean {
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  if (!unique(data.categories.map((c) => c.id))) return false;
  if (!unique(data.transactions.map((t) => t.id))) return false;
  if (!unique(data.recurrings.map((r) => r.id))) return false;

  const categories = new Map(data.categories.map((c) => [c.id, c]));
  for (const type of ['income', 'expense'] as const) {
    if (data.categories.filter((c) => c.type === type && c.isSystem).length !== 1) return false;
    const names = data.categories.filter((c) => c.type === type).map((c) => categoryNameKey(c.name));
    if (!unique(names)) return false;
  }

  const sameTypeCategory = (x: { categoryId: string; type: string }) => categories.get(x.categoryId)?.type === x.type;
  if (!data.recurrings.every(sameTypeCategory)) return false;
  if (!data.transactions.every(sameTypeCategory)) return false;

  const recurringIds = new Set(data.recurrings.map((r) => r.id));
  const pairs = new Set<string>();
  for (const t of data.transactions) {
    if (t.recurringId === undefined) continue;
    if (!recurringIds.has(t.recurringId) || t.period === undefined) return false;
    const pair = `${t.recurringId}|${t.period}`;
    if (pairs.has(pair)) return false;
    pairs.add(pair);
  }
  return true;
}

function previewOf(backup: BackupFile): RestorePreview {
  const { categories, transactions, recurrings } = backup.data;
  let from: Period | null = null;
  let to: Period | null = null;
  for (const t of transactions) {
    const p = periodOf(t.date);
    if (from === null || p < from) from = p;
    if (to === null || p > to) to = p;
  }
  return {
    exportedDate: toDateStr(new Date(backup.exportedAt)),
    counts: { transactions: transactions.length, categories: categories.length, recurrings: recurrings.length },
    range: from !== null && to !== null ? { from, to } : null,
  };
}

/** Yedek dosyasının metnini baştan sona doğrular. Hata varsa hiçbir şey yazılmamalı. */
export function parseBackup(text: string): RestoreResult {
  if (text.length > MAX_FILE_BYTES) return { ok: false, error: 'tooLarge' };

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalid' };
  }
  if (!isPlainObject(raw) || raw.app !== APP_ID) return { ok: false, error: 'invalid' };

  const version = raw.formatVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { ok: false, error: 'invalid' };
  if (version > FORMAT_VERSION) return { ok: false, error: 'newer' };

  const parsed = backupSchema.safeParse(migrate(raw));
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const backup = parsed.data as BackupFile;
  if (!hasIntegrity(backup.data)) return { ok: false, error: 'invalid' };
  return { ok: true, backup, preview: previewOf(backup) };
}
