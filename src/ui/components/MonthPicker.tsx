// Ay-yıl seçici (SPEC §6: projede yazılır). Seçili ay ve "Bitiş" alanı için ortak.
import { ChevronLeft } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { MONTHS, MONTHS_SHORT, makePeriod, parsePeriod } from '../../domain/date';
import type { Period } from '../../domain/types';
import { copy } from '../copy';
import { Sheet } from './Sheet';

interface MonthPickerProps {
  value: Period;
  /** Seçilebilecek en erken ay (dahil) */
  min?: Period;
  /** Seçilebilecek en geç ay (dahil) */
  max?: Period;
  /** Halkayla işaretlenen ay (ör. bu ay) */
  marked?: Period;
  title?: string;
  onSelect: (period: Period) => void;
  onClose: () => void;
  /** Izgaranın altında ek içerik (ör. "Bitiş yok") */
  extra?: ReactNode;
}

export function MonthPicker({ value, min, max, marked, title = copy.month.pickerTitle, onSelect, onClose, extra }: MonthPickerProps) {
  const [year, setYear] = useState(() => parsePeriod(value)?.y ?? new Date().getFullYear());
  const minYear = min ? parsePeriod(min)?.y : undefined;
  const maxYear = max ? parsePeriod(max)?.y : undefined;

  return (
    <Sheet title={title} onRequestClose={onClose} width={400}>
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={copy.month.prevYear}
            disabled={minYear !== undefined && year <= minYear}
            className="flex size-11 items-center justify-center rounded-xl text-text-2 disabled:opacity-30"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <span className="text-[17px] leading-[22px] font-semibold tabular-nums" aria-live="polite">
            {year}
          </span>
          <button
            type="button"
            aria-label={copy.month.nextYear}
            disabled={maxYear !== undefined && year >= maxYear}
            className="flex size-11 items-center justify-center rounded-xl text-text-2 disabled:opacity-30"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS_SHORT.map((short, i) => {
            const period = makePeriod(year, i + 1);
            const disabled = (min !== undefined && period < min) || (max !== undefined && period > max);
            const selected = period === value;
            return (
              <button
                key={period}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={`${MONTHS[i]} ${year}`}
                className={`h-12 rounded-xl font-medium disabled:opacity-30 ${
                  selected ? 'bg-text font-semibold text-bg' : 'bg-surface-2 text-text'
                } ${period === marked && !selected ? 'shadow-[inset_0_0_0_2px_var(--accent)]' : ''}`}
                onClick={() => onSelect(period)}
              >
                {short}
              </button>
            );
          })}
        </div>
        {extra}
      </div>
    </Sheet>
  );
}
