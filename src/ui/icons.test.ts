import { describe, expect, it } from 'vitest';
import { ICON_KEYS } from '../domain/types';
import { ICON_CATALOG, ICON_GROUPS, searchIcons } from './icons';

describe('ikon kataloğu', () => {
  it('her anahtar tam bir kez, gruplar DESIGN §6.4 sırasında', () => {
    expect(ICON_CATALOG.map((e) => e.key)).toEqual([...ICON_KEYS]);
    expect(new Set(ICON_CATALOG.map((e) => e.group))).toEqual(new Set(ICON_GROUPS));
    expect(ICON_CATALOG.every((e) => typeof e.component === 'object' || typeof e.component === 'function')).toBe(true);
  });

  it('durum ikonları katalogda yok', () => {
    const keys: string[] = ICON_CATALOG.map((e) => e.key);
    expect(keys).not.toContain('repeat');
    expect(keys).not.toContain('sticky-note');
  });

  it('Türkçe anahtar kelimeyle ve grup adıyla bulunur', () => {
    expect(searchIcons('kahve').map((e) => e.key)).toContain('coffee');
    expect(searchIcons('BENZİN').map((e) => e.key)).toEqual(['fuel']);
    expect(searchIcons('spor').map((e) => e.key)).toContain('dumbbell');
    expect(searchIcons('ulaşım').map((e) => e.key)).toEqual(expect.arrayContaining(['bus', 'car', 'fuel']));
    expect(searchIcons('')).toHaveLength(48);
    expect(searchIcons('zzz')).toEqual([]);
  });
});
