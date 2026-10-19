// Bileşen dışı tutar metinleri; tutar gizleme tercihine uyar (SPEC §5.1).
import { useCallback } from 'react';
import { usePrefs } from '../../app/prefs';
import { MASKED_AMOUNT, formatShort, formatSigned, formatTRY, formatWhole } from '../../domain/format';

/**
 * Bileşen dışındaki metinler (grafik eksenleri, baloncuklar, aria-label) için;
 * tutar gizleme açıkken hep "₺•••••" döner.
 */
export function useAmountText() {
  const { hideAmounts } = usePrefs();
  return useCallback(
    (kurus: number, style: 'standard' | 'signed' | 'short' | 'whole' = 'standard') => {
      if (hideAmounts) return MASKED_AMOUNT;
      if (style === 'signed') return formatSigned(kurus);
      if (style === 'short') return formatShort(kurus);
      if (style === 'whole') return formatWhole(kurus);
      return formatTRY(kurus);
    },
    [hideAmounts],
  );
}
