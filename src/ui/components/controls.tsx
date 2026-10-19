// Küçük kontroller (bileşen kartı): anahtar, segment, çip.
import type { ReactNode } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

/** 51×31 anahtar; açıkken vurgu renginde. */
export function Switch({ checked, onChange, label, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`hit-area flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? 'justify-end bg-accent' : 'justify-start bg-switch-off'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span className="size-[27px] rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.2)]" />
    </button>
  );
}

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Seçiliyken zemin ve metin sınıfları (ör. gelir/gider rengi) */
  selectedClass?: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  size?: 'md' | 'sm';
}

/** Tekli seçim; ok tuşlarıyla gezilir (radiogroup). */
export function Segmented<T extends string>({ label, value, options, onChange, size = 'md' }: SegmentedProps<T>) {
  const move = (dir: number) => {
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + dir + options.length) % options.length];
    if (next) onChange(next.value);
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid rounded-xl bg-surface-2 p-[3px] ${size === 'sm' ? 'rounded-[10px]' : ''}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          move(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`hit-area rounded-[10px] ${size === 'sm' ? 'h-[30px] rounded-lg px-3 text-[13px] leading-[18px]' : 'h-[38px]'} ${
              selected ? `font-semibold ${o.selectedClass ?? 'bg-surface text-text'}` : 'font-medium text-text-2'
            }`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface ChipProps {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Basılı durum yerine düğme olarak (ör. Tarih seç) */
  asButton?: boolean;
  className?: string;
  id?: string;
}

/** 36 px çip; seçiliyken dolgulu (text zemin, bg metin). */
export function Chip({ pressed, onClick, children, asButton = false, className = '', id }: ChipProps) {
  return (
    <button
      id={id}
      type="button"
      aria-pressed={asButton ? undefined : pressed}
      className={`hit-area flex h-9 shrink-0 items-center gap-1 rounded-[18px] px-3.5 text-[13px] whitespace-nowrap ${
        pressed ? 'bg-text font-semibold text-bg' : 'bg-surface font-medium text-text shadow-[inset_0_0_0_1px_var(--border)]'
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Form alanı etiketi (13/18, text-2). */
export function FieldLabel({ children, htmlFor, id }: { children: ReactNode; htmlFor?: string; id?: string }) {
  return (
    <label id={id} htmlFor={htmlFor} className="text-[13px] leading-[18px] font-medium text-text-2">
      {children}
    </label>
  );
}

/** Alanın altında 13 px expense renginde hata. */
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} role="alert" className="text-[13px] leading-[18px] font-medium text-expense">
      {children}
    </span>
  );
}
