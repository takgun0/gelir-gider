import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CATEGORIES,
  defaultCategoryRecords,
  defaultColor,
  findSystemCategory,
  sortForGrid,
  validateCategoryName,
} from './categories';
import { PALETTE_KEYS } from './types';

describe('varsayılan kategoriler', () => {
  it('14 kategori, her türde tek sistem "Diğer"', () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(14);
    expect(DEFAULT_CATEGORIES.filter((c) => c.type === 'expense')).toHaveLength(10);
    const records = defaultCategoryRecords(5, (() => { let n = 0; return () => `id-${n++}`; })());
    expect(findSystemCategory(records, 'expense')?.name).toBe('Diğer');
    expect(findSystemCategory(records, 'income')?.name).toBe('Diğer');
    expect(records.filter((c) => c.isSystem)).toHaveLength(2);
    expect(new Set(records.map((c) => c.id)).size).toBe(14);
    expect(records[0]).toMatchObject({ createdAt: 5, name: 'Market' });
  });
});

describe('ızgara sıralaması', () => {
  it('Türkçe alfabe, Diğer en sonda', () => {
    const grid = sortForGrid(DEFAULT_CATEGORIES.filter((c) => c.type === 'expense'));
    expect(grid.map((c) => c.name)).toEqual([
      'Abonelikler', 'Eğitim', 'Eğlence', 'Faturalar', 'Kira', 'Market', 'Sağlık', 'Ulaşım', 'Yemek', 'Diğer',
    ]);
    expect(sortForGrid(DEFAULT_CATEGORIES.filter((c) => c.type === 'income')).map((c) => c.name)).toEqual([
      'Burs', 'Ek gelir', 'Maaş', 'Diğer',
    ]);
  });
});

describe('varsayılan renk', () => {
  it('o türde kullanılmayan ilk palet rengi', () => {
    expect(defaultColor([], 'expense')).toBe('gul');
    expect(defaultColor(DEFAULT_CATEGORIES, 'expense')).toBe('civit');
    expect(defaultColor(DEFAULT_CATEGORIES, 'income')).toBe('gul');
  });

  it('hepsi kullanıldıysa ilk renk', () => {
    const all = PALETTE_KEYS.map((color) => ({ type: 'expense' as const, color }));
    expect(defaultColor(all, 'expense')).toBe('gul');
  });
});

describe('kategori adı doğrulaması', () => {
  const cats = [
    { id: '1', name: 'Market', type: 'expense' as const },
    { id: '2', name: 'Diğer', type: 'income' as const },
  ];

  it('boş, uzun ve tekrar eden ad', () => {
    expect(validateCategoryName('  ', 'expense', cats)).toBe('emptyName');
    expect(validateCategoryName('x'.repeat(25), 'expense', cats)).toBe('nameTooLong');
    expect(validateCategoryName(' MARKET ', 'expense', cats)).toBe('duplicateName');
    expect(validateCategoryName('market', 'income', cats)).toBeNull();
    expect(validateCategoryName('DİĞER', 'income', cats)).toBe('duplicateName');
  });

  it('düzenlerken kendisiyle çakışmaz', () => {
    expect(validateCategoryName('Market', 'expense', cats, '1')).toBeNull();
  });
});
