// Buton varyantları (bileşen kartı): birincil 52 px, ikincil ve tehlikeli 48 px, köşe 12.
// Basılı hal hafif kararma, pasif hal düşük opaklık; odak halkası global :focus-visible'dan.
import type { ButtonHTMLAttributes, Ref } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const VARIANT: Record<Variant, string> = {
  primary: 'h-[52px] bg-accent text-on-accent text-base',
  secondary: 'h-12 bg-surface-2 text-text',
  danger: 'h-12 bg-expense text-on-expense',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`w-full rounded-xl px-4 font-semibold transition-[filter] active:brightness-90 disabled:opacity-40 ${VARIANT[variant]} ${className}`}
      {...rest}
    />
  );
}
