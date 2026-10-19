// SPEC §4 veri modeli tipleri. Saf TypeScript; React ve Dexie bağımlılığı yok.

export type TxType = 'income' | 'expense';

export const PALETTE_KEYS = [
  'gul', 'fusya', 'mor', 'civit', 'mavi', 'gok', 'camgobegi',
  'petrol', 'zeytin', 'hardal', 'amber', 'turuncu', 'kahve', 'arduvaz',
] as const;

export type PaletteKey = (typeof PALETTE_KEYS)[number];

/**
 * İkon kataloğunun anahtarları (Lucide adları). Bileşen eşlemesi, grup ve anahtar
 * kelimeler src/ui/icons.ts'tedir; yedek doğrulaması React'e bağlanmasın diye
 * liste burada durur. "repeat" ve "sticky-note" bilerek yok (SPEC §5.4).
 */
export const ICON_KEYS = [
  // Alışveriş
  'shopping-cart', 'shopping-bag', 'shirt', 'gift', 'store', 'package',
  // Ev
  'house', 'sofa', 'lightbulb', 'droplet', 'wifi',
  // Ulaşım
  'bus', 'car', 'fuel', 'plane', 'bike', 'square-parking',
  // Yemek
  'utensils', 'coffee', 'pizza', 'apple', 'wine',
  // Sağlık
  'heart-pulse', 'pill', 'stethoscope', 'dumbbell',
  // Eğlence
  'ticket', 'music', 'film', 'gamepad-2', 'monitor-play', 'smartphone',
  // Finans
  'banknote', 'coins', 'wallet', 'piggy-bank', 'credit-card', 'landmark', 'receipt', 'briefcase',
  // Eğitim
  'book-open', 'graduation-cap', 'pencil', 'laptop',
  // Diğer
  'tag', 'ellipsis', 'paw-print', 'scissors',
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

/** YYYY-MM-DD, yerel saat. */
export type DateStr = string;
/** YYYY-MM */
export type Period = string;

export interface Category {
  id: string;
  /** 1–24 karakter; aynı türde tekil */
  name: string;
  /** Oluşturulduktan sonra değişmez. */
  type: TxType;
  color: PaletteKey;
  icon: IconKey;
  /** Yalnızca iki "Diğer" kategorisi için true. */
  isSystem: boolean;
  createdAt: number;
}

export interface Transaction {
  id: string;
  /** Kategorinin türüyle aynı olmalı. */
  type: TxType;
  /** Kuruş, 1 ≤ amount ≤ 99_999_999_999 */
  amount: number;
  categoryId: string;
  /** Yerel saat, en fazla bugün. */
  date: DateStr;
  /** 0–80 karakter, tek satır */
  description: string;
  /** 0–500 karakter, çok satır */
  note: string;
  /** Yalnızca bir sabit işleme bağlıysa yazılır; boş string asla yazılmaz. */
  recurringId?: string;
  /** Yalnızca recurringId varsa. */
  period?: Period;
  createdAt: number;
  updatedAt: number;
}

export interface Recurring {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  description: string;
  /** Oluşan her kayda kopyalanır. */
  note: string;
  /** 1–31 */
  dayOfMonth: number;
  /** İlk örneğin tarihi; sonradan değişmez. */
  startDate: DateStr;
  /** Bu ay dahil. */
  endPeriod?: Period;
  active: boolean;
  /** İşlenmiş son dönem. */
  lastGeneratedPeriod: Period;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  id: 'app';
  /** Yalnızca JSON yedeği alınınca güncellenir. */
  lastBackupAt?: number;
}
