// Seçili ay uygulama genelinde tek bir state'tir (Gereksinimler §6, Tasarım §5): açılışta bu ay,
// en fazla 12 ay ileri.
import { createContext, useContext, useState, type ReactNode } from 'react';
import { addMonths, periodOf } from '../domain/date';
import { MAX_MONTHS_AHEAD } from '../domain/recurring';
import type { Period } from '../domain/types';
import { useToday } from './today';

export interface SelectedMonth {
  period: Period;
  /** İçinde bulunulan ay */
  current: Period;
  /** Seçilebilecek en ileri ay */
  max: Period;
  isCurrent: boolean;
  isFuture: boolean;
  setPeriod: (period: Period) => void;
  shift: (months: number) => void;
}

const MonthContext = createContext<SelectedMonth | null>(null);

export function clampPeriod(period: Period, max: Period): Period {
  return period > max ? max : period;
}

export function SelectedMonthProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const current = periodOf(today);
  const max = addMonths(current, MAX_MONTHS_AHEAD);
  const [selected, setSelected] = useState<Period>(current);
  // Sınır okuma anında uygulanır; "bugün" değişince de geçerli kalır.
  const period = clampPeriod(selected, max);

  const value: SelectedMonth = {
    period,
    current,
    max,
    isCurrent: period === current,
    isFuture: period > current,
    setPeriod: (p) => setSelected(clampPeriod(p, max)),
    shift: (months) => setSelected((p) => clampPeriod(addMonths(clampPeriod(p, max), months), max)),
  };
  return <MonthContext value={value}>{children}</MonthContext>;
}

export function useSelectedMonth(): SelectedMonth {
  const value = useContext(MonthContext);
  if (!value) throw new Error('SelectedMonthProvider eksik');
  return value;
}
