// SPEC §4 veri modeli tipleri. Saf TypeScript; React ve Dexie bağımlılığı yok.

export type TxType = 'income' | 'expense';

export const PALETTE_KEYS = [
  'gul', 'fusya', 'mor', 'civit', 'mavi', 'gok', 'camgobegi',
  'petrol', 'zeytin', 'hardal', 'amber', 'turuncu', 'kahve', 'arduvaz',
] as const;

export type PaletteKey = (typeof PALETTE_KEYS)[number];

/** YYYY-MM-DD, yerel saat. */
export type DateStr = string;
/** YYYY-MM */
export type Period = string;
