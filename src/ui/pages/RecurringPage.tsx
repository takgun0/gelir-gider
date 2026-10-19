// İşlemler › Sabit (Tasarım §6.5): aktifler sonraki tarihe göre; durdurulan ve bitenler soluk.
import { Plus } from 'lucide-react';
import { Repeat } from 'lucide-react';
import { useMemo } from 'react';
import { useToday } from '../../app/today';
import { useTxSheet } from '../../app/tx-sheet';
import { dayMonth, monthLabel } from '../../domain/date';
import { isEnded, nextOccurrence } from '../../domain/recurring';
import { recurringTotals } from '../../domain/stats';
import { compareTr } from '../../domain/text';
import type { Recurring } from '../../domain/types';
import { contextFrom } from '../../db/context';
import { db } from '../../db/db';
import { setRecurringActive } from '../../db/ops/recurrings';
import { Amount } from '../components/Amount';
import { CategoryIcon } from '../components/CategoryIcon';
import { Switch } from '../components/controls';
import { EmptyState } from '../components/EmptyState';
import { Page, PageTitle } from '../components/Page';
import { copy } from '../copy';
import { useCategoryMap, useRecurrings } from '../data';
import { rowTitle } from '../tx/list';
import { TxTabs } from '../tx/TxTabs';

export function RecurringPage() {
  const today = useToday();
  const { openNew, openRecurring } = useTxSheet();
  const recurrings = useRecurrings();
  const categoryMap = useCategoryMap();

  const groups = useMemo(() => {
    if (!recurrings || !categoryMap) return null;
    const name = (r: Recurring) => rowTitle(r, categoryMap.get(r.categoryId));
    const active = recurrings
      .filter((r) => r.active && !isEnded(r, today))
      .map((r) => ({ r, next: nextOccurrence(r, today) }))
      .sort((a, b) => (a.next ?? '9999').localeCompare(b.next ?? '9999') || compareTr(name(a.r), name(b.r)));
    const inactive = recurrings
      .filter((r) => !r.active || isEnded(r, today))
      .sort((a, b) => compareTr(name(a), name(b)));
    return { active, inactive, name };
  }, [recurrings, categoryMap, today]);

  const totals = recurrings ? recurringTotals(recurrings, today) : null;

  const row = (r: Recurring, sub: string, withSwitch: boolean, name: string) => {
    const c = categoryMap?.get(r.categoryId);
    return (
      <div key={r.id} className="flex min-h-16 items-center gap-3 py-2">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 self-stretch text-left" onClick={() => openRecurring(r.id)}>
          {c && <CategoryIcon icon={c.icon} color={c.color} />}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{name}</span>
            <span className="line-clamp-2 text-[13px] leading-[18px] font-medium text-text-2">{sub}</span>
          </span>
          <Amount kurus={r.amount} type={r.type} className="text-base leading-[22px] font-semibold" />
        </button>
        {withSwitch ? (
          <Switch
            checked={r.active}
            label={r.active ? copy.recurring.switchOn(name) : copy.recurring.switchOff(name)}
            onChange={(active) => void setRecurringActive(db, r.id, active, contextFrom())}
          />
        ) : (
          <span className="w-[51px] shrink-0" />
        )}
      </div>
    );
  };

  return (
    <Page>
      <header className="flex flex-col gap-3 lg:h-12 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex items-center justify-between">
          <PageTitle>{copy.nav.transactions}</PageTitle>
          <button
            type="button"
            className="flex h-10 items-center gap-1 rounded-xl px-2 font-semibold text-accent lg:hidden"
            onClick={() => openNew({ repeat: true })}
          >
            <Plus size={18} aria-hidden="true" />
            {copy.recurring.add}
          </button>
        </div>
        <TxTabs />
        <div className="hidden flex-1 lg:block" />
        <button
          type="button"
          className="hidden h-10 items-center gap-1 rounded-xl px-2 font-semibold text-accent lg:flex"
          onClick={() => openNew({ repeat: true })}
        >
          <Plus size={18} aria-hidden="true" />
          {copy.recurring.add}
        </button>
      </header>

      {groups && recurrings?.length === 0 && (
        <EmptyState icon={Repeat} message={copy.recurring.empty} action={{ label: copy.recurring.emptyAction, onClick: () => openNew({ repeat: true }) }} />
      )}

      {groups && totals && recurrings && recurrings.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-surface p-4">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.recurring.monthlyIncome}</span>
              <Amount kurus={totals.income} type="income" className="text-base leading-[22px] font-semibold" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.recurring.monthlyExpense}</span>
              <Amount kurus={totals.expense} type="expense" className="text-base leading-[22px] font-semibold" />
            </div>
          </div>

          {groups.active.length > 0 && (
            <section className="flex flex-col gap-1">
              <div className="flex justify-between px-1 text-[13px] leading-[18px] font-medium text-text-2 sm:px-5">
                <h2 className="m-0 text-[13px] leading-[18px] font-semibold">{copy.recurring.active}</h2>
                <span>{copy.recurring.countLabel(groups.active.length)}</span>
              </div>
              <div className="rounded-2xl bg-surface px-4 py-1">
                {groups.active.map(({ r, next }) =>
                  row(r, `${copy.recurring.day(r.dayOfMonth)}${next ? ` · ${copy.recurring.next(dayMonth(next))}` : ''}`, true, groups.name(r)),
                )}
              </div>
            </section>
          )}

          {groups.inactive.length > 0 && (
            <section className="flex flex-col gap-1">
              <div className="flex justify-between px-1 text-[13px] leading-[18px] font-medium text-text-2 sm:px-5">
                <h2 className="m-0 text-[13px] leading-[18px] font-semibold">{copy.recurring.inactive}</h2>
                <span>{groups.inactive.length}</span>
              </div>
              <div className="rounded-2xl bg-surface px-4 py-1 opacity-55">
                {groups.inactive.map((r) => {
                  const ended = isEnded(r, today) && r.endPeriod !== undefined;
                  const sub = `${copy.recurring.day(r.dayOfMonth)} · ${
                    ended ? copy.recurring.ended(monthLabel(r.endPeriod as string)) : copy.recurring.paused
                  }`;
                  return row(r, sub, !ended, groups.name(r));
                })}
              </div>
            </section>
          )}
        </>
      )}
    </Page>
  );
}
