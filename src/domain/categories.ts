// Kategori kuralları (Gereksinimler §5.4, Tasarım §6.4 ve §10).
import { categoryNameKey, compareTr } from './text';
import { PALETTE_KEYS, type Category, type IconKey, type PaletteKey, type TxType } from './types';

export const NAME_MAX = 24;
/** Yeni kategorinin varsayılan ikonu. */
export const DEFAULT_ICON: IconKey = 'tag';

type CategorySeed = Pick<Category, 'name' | 'type' | 'icon' | 'color' | 'isSystem'>;

/** Tasarım §10: ilk açılışta gelen 14 kategori. */
export const DEFAULT_CATEGORIES: readonly CategorySeed[] = [
  { type: 'expense', name: 'Market', icon: 'shopping-cart', color: 'turuncu', isSystem: false },
  { type: 'expense', name: 'Kira', icon: 'house', color: 'kahve', isSystem: false },
  { type: 'expense', name: 'Faturalar', icon: 'receipt', color: 'amber', isSystem: false },
  { type: 'expense', name: 'Ulaşım', icon: 'bus', color: 'mavi', isSystem: false },
  { type: 'expense', name: 'Yemek', icon: 'utensils', color: 'gul', isSystem: false },
  { type: 'expense', name: 'Eğlence', icon: 'ticket', color: 'fusya', isSystem: false },
  { type: 'expense', name: 'Sağlık', icon: 'heart-pulse', color: 'camgobegi', isSystem: false },
  { type: 'expense', name: 'Abonelikler', icon: 'monitor-play', color: 'mor', isSystem: false },
  { type: 'expense', name: 'Eğitim', icon: 'book-open', color: 'gok', isSystem: false },
  { type: 'expense', name: 'Diğer', icon: 'ellipsis', color: 'arduvaz', isSystem: true },
  { type: 'income', name: 'Maaş', icon: 'banknote', color: 'petrol', isSystem: false },
  { type: 'income', name: 'Burs', icon: 'graduation-cap', color: 'zeytin', isSystem: false },
  { type: 'income', name: 'Ek gelir', icon: 'coins', color: 'hardal', isSystem: false },
  { type: 'income', name: 'Diğer', icon: 'ellipsis', color: 'arduvaz', isSystem: true },
];

export function defaultCategoryRecords(now: number, newId: () => string): Category[] {
  return DEFAULT_CATEGORIES.map((seed) => ({ id: newId(), createdAt: now, ...seed }));
}

/** Sistem "Diğer" kategorisi isimle değil bayrakla bulunur. */
export function findSystemCategory<C extends Pick<Category, 'type' | 'isSystem'>>(categories: readonly C[], type: TxType): C | undefined {
  return categories.find((c) => c.type === type && c.isSystem);
}

/** İşlem formundaki ızgara: Türkçe alfabe, "Diğer" en sonda. */
export function sortForGrid<C extends Pick<Category, 'name' | 'isSystem'>>(categories: readonly C[]): C[] {
  return [...categories].sort((a, b) => Number(a.isSystem) - Number(b.isSystem) || compareTr(a.name, b.name));
}

/** Yeni kategorinin rengi: o türde henüz kullanılmayan ilk palet rengi; hepsi kullanıldıysa ilki. */
export function defaultColor(categories: readonly Pick<Category, 'type' | 'color'>[], type: TxType): PaletteKey {
  const used = new Set(categories.filter((c) => c.type === type).map((c) => c.color));
  return PALETTE_KEYS.find((k) => !used.has(k)) ?? PALETTE_KEYS[0];
}

export type CategoryNameError = 'emptyName' | 'nameTooLong' | 'duplicateName';

/** Ad zorunlu, en fazla 24 karakter, aynı türde tekil (kendisi hariç). */
export function validateCategoryName(
  name: string,
  type: TxType,
  categories: readonly Pick<Category, 'id' | 'name' | 'type'>[],
  selfId?: string,
): CategoryNameError | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'emptyName';
  if (trimmed.length > NAME_MAX) return 'nameTooLong';
  const key = categoryNameKey(trimmed);
  const clash = categories.some((c) => c.type === type && c.id !== selfId && categoryNameKey(c.name) === key);
  return clash ? 'duplicateName' : null;
}
