import type { CSSProperties } from 'react';
import type { PaletteKey } from '../../domain/types';

/** Kategori rengi palet anahtarından türetilen CSS değişkenidir (Gereksinimler §5.7). */
export function categoryColorStyle(color: PaletteKey): CSSProperties {
  return { '--cat': `var(--c-${color})` } as CSSProperties;
}
