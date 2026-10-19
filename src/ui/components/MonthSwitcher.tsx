// ‹ Ekim 2026 › (DESIGN §5 "Ay seçimi"): ortadaki etiket ay-yıl seçiciyi açar,
// bu ay dışındayken "Bu ay" kısa yolu belirir. En fazla 12 ay ileri.
import { ChevronLeft } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useSelectedMonth } from '../../app/month';
import { monthLabel } from '../../domain/date';
import { copy } from '../copy';
import { MonthPicker } from './MonthPicker';

interface MonthSwitcherProps {
  /** Masaüstü Özet'te etiket ekran başlığı boyutunda */
  large?: boolean;
}

export function MonthSwitcher({ large = false }: MonthSwitcherProps) {
  const { period, current, max, isCurrent, setPeriod, shift } = useSelectedMonth();
  const [picking, setPicking] = useState(false);
  const atMax = period >= max;

  return (
    <div className="-ml-3 flex min-w-0 items-center gap-1">
      <button
        type="button"
        aria-label={copy.month.prev}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-text-2"
        onClick={() => shift(-1)}
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-haspopup="dialog"
        className={`h-11 shrink-0 px-1 font-semibold whitespace-nowrap ${
          large ? 'text-[17px] leading-[22px] lg:text-[22px] lg:leading-7' : 'text-[17px] leading-[22px]'
        }`}
        onClick={() => setPicking(true)}
      >
        {monthLabel(period)}
      </button>
      <button
        type="button"
        aria-label={copy.month.next}
        disabled={atMax}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-text-2 disabled:opacity-30"
        onClick={() => shift(1)}
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
      {!isCurrent && (
        <button
          type="button"
          className="hit-area ml-1 h-8 shrink-0 rounded-2xl bg-surface px-3 text-[13px] leading-[18px] font-semibold text-accent shadow-[inset_0_0_0_1px_var(--border)]"
          onClick={() => setPeriod(current)}
        >
          {copy.month.thisMonth}
        </button>
      )}
      {picking && (
        <MonthPicker
          value={period}
          max={max}
          marked={current}
          onClose={() => setPicking(false)}
          onSelect={(p) => {
            setPeriod(p);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
