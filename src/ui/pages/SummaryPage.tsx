// Özet (DESIGN §6.1): önce Kalan, sonra gelir ve gider, sonra ayrıntı.
import { CalendarX2 } from 'lucide-react';
import { Eye } from 'lucide-react';
import { EyeOff } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useSelectedMonth } from '../../app/month';
import type { TransactionsNavState } from '../../app/nav-state';
import { usePrefs } from '../../app/prefs';
import { useToday } from '../../app/today';
import { useToast } from '../../app/toast';
import { useTxSheet } from '../../app/tx-sheet';
import { addMonths, monthLabel, monthName, periodRange, startOfWeek } from '../../domain/date';
import { projectPlanned } from '../../domain/recurring';
import { dailySeries, lastMonthsSeries, monthEndForecast, todayAndWeek, totals } from '../../domain/stats';
import type { TxType } from '../../domain/types';
import { db } from '../../db/db';
import { deleteTransaction, restoreTransaction } from '../../db/ops/transactions';
import { EmptyState } from '../components/EmptyState';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { Page } from '../components/Page';
import { copy } from '../copy';
import { useCategoryMap, useMonthTransactions, useRangeTransactions, useRecurrings, useTransactionCount } from '../data';
import { CategoryBreakdown } from '../summary/CategoryBreakdown';
import { HeroCard, TodayWeekLine, TotalCard, Welcome } from '../summary/cards';
import { DailyChart } from '../summary/DailyChart';
import { PlannedList, RecentList } from '../summary/lists';
import { MonthsChart } from '../summary/MonthsChart';
import { newestFirst } from '../tx/list';

const UPCOMING_LIMIT = 5;
const RECENT_LIMIT = 5;

export function SummaryPage() {
  const { hideAmounts, setHideAmounts } = usePrefs();
  const navigate = useNavigate();
  const toast = useToast();
  const today = useToday();
  const { openNew, openEdit, openRecurring } = useTxSheet();
  const { period, current, isCurrent, isFuture } = useSelectedMonth();

  const monthTxs = useMonthTransactions(period);
  const weekTxs = useRangeTransactions(startOfWeek(today), today);
  const sixMonthTxs = useRangeTransactions(periodRange(addMonths(period, -5)).start, periodRange(period).end);
  const recurrings = useRecurrings();
  const categories = useCategoryMap();
  const totalCount = useTransactionCount();

  const view = useMemo(() => {
    if (!monthTxs || !recurrings) return null;
    const planned = period >= current ? projectPlanned(recurrings, period, today) : [];
    const actual = totals(monthTxs);
    const plannedTotals = totals(planned);
    return {
      planned,
      actual,
      plannedTotals,
      forecast: isCurrent ? monthEndForecast(actual.net, planned) : null,
      daily: dailySeries(monthTxs, period, today),
      recent: [...monthTxs].sort(newestFirst).slice(0, RECENT_LIMIT),
    };
  }, [monthTxs, recurrings, period, current, today, isCurrent]);

  const openType = (type: TxType) => {
    const state: TransactionsNavState = { type };
    void navigate('/islemler', { state });
  };

  const remove = async (id: string) => {
    const removed = await deleteTransaction(db, id);
    if (removed) {
      toast({ message: copy.toast.deleted, action: { label: copy.toast.undo, onAction: () => void restoreTransaction(db, removed) } });
    }
  };

  const loaded = view && categories && totalCount !== undefined && recurrings;
  const firstRun = loaded && totalCount === 0 && recurrings.length === 0;
  const hasRecords = (monthTxs?.length ?? 0) > 0;

  return (
    <Page>
      <header className="flex h-12 items-center justify-between gap-2">
        <h1 className="sr-only">{copy.nav.summary}</h1>
        <MonthSwitcher large />
        <button
          type="button"
          aria-label={hideAmounts ? copy.amount.show : copy.amount.hide}
          aria-pressed={hideAmounts}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-text-2"
          onClick={() => setHideAmounts(!hideAmounts)}
        >
          {hideAmounts ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </header>

      {firstRun && <Welcome onAdd={() => openNew()} />}

      {loaded && !firstRun && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <div className="col-span-2 grid">
              <HeroCard
                monthName={monthName(period)}
                net={isFuture ? view.plannedTotals.net : view.actual.net}
                planned={isFuture}
                forecast={view.forecast}
              />
            </div>
            <TotalCard
              type="income"
              amount={isFuture ? view.plannedTotals.income : view.actual.income}
              planned={isFuture}
              onOpen={() => openType('income')}
            />
            <TotalCard
              type="expense"
              amount={isFuture ? view.plannedTotals.expense : view.actual.expense}
              planned={isFuture}
              onOpen={() => openType('expense')}
            />
          </div>

          {isCurrent && weekTxs && <TodayWeekLine {...todayAndWeek(weekTxs, today)} />}

          {!isFuture && !hasRecords && (
            <EmptyState
              icon={CalendarX2}
              message={copy.transactions.emptyMonth(monthLabel(period))}
              action={{ label: copy.transactions.add, onClick: () => openNew() }}
            />
          )}

          {!isFuture && hasRecords && (
            <>
              <DailyChart period={period} today={today} days={view.daily.days} average={view.daily.average} />
              <div className="grid gap-4 lg:grid-cols-2">
                <CategoryBreakdown transactions={monthTxs ?? []} categories={categories} />
                {sixMonthTxs && <MonthsChart months={lastMonthsSeries(sixMonthTxs, period)} />}
              </div>
            </>
          )}

          {isFuture && (
            <PlannedList
              title={copy.summary.plannedTitle}
              note={copy.summary.plannedNote}
              items={view.planned}
              categories={categories}
              today={today}
              relative={false}
              onOpen={openRecurring}
            />
          )}

          {(isCurrent || hasRecords) && (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {isCurrent && (
                <PlannedList
                  title={copy.summary.upcoming}
                  items={view.planned.slice(0, UPCOMING_LIMIT)}
                  categories={categories}
                  today={today}
                  relative
                  empty={copy.summary.noUpcoming}
                  onOpen={openRecurring}
                />
              )}
              {hasRecords && (
                <RecentList items={view.recent} categories={categories} today={today} onOpen={openEdit} onDelete={(id) => void remove(id)} />
              )}
            </div>
          )}
        </>
      )}
    </Page>
  );
}
