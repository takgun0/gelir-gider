// Takvim (Gereksinimler §6: projede yazılır, yerel <input type="date"> kullanılmaz).
// Hafta Pazartesi başlar; bugünden sonraki günler seçilemez.
import { ChevronLeft } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { addMonths, calendarWeeks, dayOfMonth, longDate, monthLabel, periodOf, WEEKDAYS_SHORT } from '../../domain/date';
import type { DateStr } from '../../domain/types';
import { copy } from '../copy';
import { Sheet } from './Sheet';

interface CalendarProps {
  value: DateStr;
  today: DateStr;
  onSelect: (date: DateStr) => void;
  onClose: () => void;
}

export function Calendar({ value, today, onSelect, onClose }: CalendarProps) {
  const [period, setPeriod] = useState(() => periodOf(value));
  const atCurrent = period >= periodOf(today);

  return (
    <Sheet title={copy.form.pickDate} onRequestClose={onClose} width={400}>
      <div className="flex flex-col gap-3 pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={copy.calendar.prevMonth}
            className="flex size-11 items-center justify-center rounded-xl text-text-2"
            onClick={() => setPeriod((p) => addMonths(p, -1))}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <span className="text-[17px] leading-[22px] font-semibold" aria-live="polite">
            {monthLabel(period)}
          </span>
          <button
            type="button"
            aria-label={copy.calendar.nextMonth}
            disabled={atCurrent}
            className="flex size-11 items-center justify-center rounded-xl text-text-2 disabled:opacity-30"
            onClick={() => setPeriod((p) => addMonths(p, 1))}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
        <table className="w-full table-fixed border-collapse text-center" aria-label={monthLabel(period)}>
          <thead>
            <tr>
              {WEEKDAYS_SHORT.map((d) => (
                <th key={d} scope="col" className="pb-1 text-xs leading-4 font-medium text-text-2">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendarWeeks(period).map((week, i) => (
              <tr key={i}>
                {week.map((date, j) => (
                  <td key={j} className="p-0.5">
                    {date && (
                      <button
                        type="button"
                        disabled={date > today}
                        aria-pressed={date === value}
                        aria-label={longDate(date, today)}
                        className={`h-11 w-full rounded-xl tabular-nums disabled:opacity-30 ${
                          date === value
                            ? 'bg-text font-semibold text-bg'
                            : date === today
                              ? 'font-semibold text-accent'
                              : 'font-medium text-text'
                        }`}
                        onClick={() => onSelect(date)}
                      >
                        {dayOfMonth(date)}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sheet>
  );
}

interface DayPickerProps {
  value: number;
  onSelect: (day: number) => void;
  onClose: () => void;
}

/** "Ayın kaçında": 1–31. */
export function DayPicker({ value, onSelect, onClose }: DayPickerProps) {
  return (
    <Sheet title={copy.form.dayOfMonth} onRequestClose={onClose} width={400}>
      <div className="grid grid-cols-7 gap-1 pb-2">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={d === value}
            className={`h-11 rounded-xl tabular-nums ${d === value ? 'bg-text font-semibold text-bg' : 'bg-surface-2 font-medium text-text'}`}
            onClick={() => onSelect(d)}
          >
            {d}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
