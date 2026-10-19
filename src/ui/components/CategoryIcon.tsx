// Kategori ikonu: renkli yumuşak daire (%16), ikon tam renkte (DESIGN §4).
// Renk palet anahtarından türetilen CSS değişkenidir; stile kullanıcı string'i girmez.
import type { IconKey, PaletteKey } from '../../domain/types';
import { iconEntry } from '../icons';
import { categoryColorStyle } from './category-style';

const SIZES = {
  sm: { box: 'size-8', icon: 16 },
  md: { box: 'size-10', icon: 20 },
  lg: { box: 'size-16', icon: 30 },
} as const;

interface CategoryIconProps {
  icon: IconKey;
  color: PaletteKey;
  size?: keyof typeof SIZES;
}

export function CategoryIcon({ icon, color, size = 'md' }: CategoryIconProps) {
  const { component: Icon } = iconEntry(icon);
  const s = SIZES[size];
  return (
    <span
      aria-hidden="true"
      style={categoryColorStyle(color)}
      className={`flex ${s.box} shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--cat)_16%,transparent)] text-[var(--cat)]`}
    >
      <Icon size={s.icon} strokeWidth={1.75} />
    </span>
  );
}
