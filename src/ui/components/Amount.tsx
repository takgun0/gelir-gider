// Ekrandaki her tutar bu bileşenden geçer (SPEC §5.1).
// - tabular-nums
// - kahraman varyantında ₺ ve kuruş bir kademe küçük, text-2 renginde
// - tutar gizleme açıkken "₺•••••" (ekran okuyucu metni de gizli)
import { usePrefs } from '../../app/prefs';
import { MASKED_AMOUNT, formatSigned, formatTRY, heroParts, signedAmount } from '../../domain/format';
import type { TxType } from '../../domain/types';
import { copy } from '../copy';

interface AmountProps {
  /** Kuruş. type verilirse pozitif tutar, verilmezse işaretli değer. */
  kurus: number;
  /** Gelir/gider: işaret ve renk türden gelir. */
  type?: TxType;
  /** type yokken +/− işareti gösterilsin mi (sıfır işaretsiz). */
  signed?: boolean;
  variant?: 'inline' | 'hero';
  /** auto: gelir yeşil, gider token rengi, negatif bakiye kırmızı. plain: rengi devralır. */
  tone?: 'auto' | 'plain';
  className?: string;
}

export function Amount({ kurus, type, signed = false, variant = 'inline', tone = 'auto', className = '' }: AmountProps) {
  const { hideAmounts } = usePrefs();
  const value = type ? signedAmount(kurus, type) : kurus;
  const isSigned = type !== undefined || signed;

  if (hideAmounts) {
    return (
      <span className={`whitespace-nowrap tabular-nums ${tone === 'auto' ? 'text-text-2' : ''} ${className}`}>
        <span aria-hidden="true">{MASKED_AMOUNT}</span>
        <span className="sr-only">{copy.amount.hiddenSr}</span>
      </span>
    );
  }

  if (variant === 'hero') {
    const parts = heroParts(value, isSigned);
    const negative = value < 0;
    return (
      <span className={`flex items-baseline font-semibold tracking-[-0.02em] whitespace-nowrap tabular-nums ${className}`}>
        <span className={`text-[28px] leading-[44px] lg:text-[34px] lg:leading-[52px] ${negative ? 'text-expense' : 'text-text-2'}`}>
          {parts.sign}
        </span>
        <span className={`text-[40px] leading-[44px] lg:text-[48px] lg:leading-[52px] ${negative ? 'text-expense' : 'text-text'}`}>
          {parts.integer}
        </span>
        <span className="text-[28px] leading-[44px] text-text-2 lg:text-[34px] lg:leading-[52px]">{parts.fraction}</span>
      </span>
    );
  }

  let color = '';
  if (tone === 'auto' && value !== 0) {
    if (type === 'income') color = 'text-income';
    else if (type === 'expense') color = 'text-amount-expense';
    else if (value < 0) color = 'text-expense';
  }
  return (
    <span className={`whitespace-nowrap tabular-nums ${color} ${className}`}>
      {isSigned ? formatSigned(value) : formatTRY(value)}
    </span>
  );
}

