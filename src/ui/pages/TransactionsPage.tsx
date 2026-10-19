// İşlemler › Kayıtlar (Tasarım §6.2).
import { ChevronDown } from 'lucide-react';
import { ListPlus } from 'lucide-react';
import { Search } from 'lucide-react';
import { SearchX } from 'lucide-react';
import { X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useSelectedMonth } from '../../app/month';
import { readNavState } from '../../app/nav-state';
import { useToday } from '../../app/today';
import { useToast } from '../../app/toast';
import { useTxSheet } from '../../app/tx-sheet';
import { useMediaQuery } from '../../app/viewport';
import { dayHeading, monthLabel, shortDate } from '../../domain/date';
import { projectPlanned } from '../../domain/recurring';
import { filterSummary } from '../../domain/stats';
import type { Category, Transaction } from '../../domain/types';
import { db } from '../../db/db';
import { deleteTransaction, restoreTransaction } from '../../db/ops/transactions';
import { Amount } from '../components/Amount';
import { Chip } from '../components/controls';
import { EmptyState } from '../components/EmptyState';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { Page, PageTitle } from '../components/Page';
import { copy } from '../copy';
import { useAllTransactions, useCategoryMap, useMonthTransactions, useRecurrings, useTransactionCount } from '../data';
import { CategoryFilterSheet } from '../tx/CategoryFilterSheet';
import { NO_FILTERS, applyFilters, groupByDay, groupByMonth, isFiltered, rowTitle, searchTransactions, type Filters } from '../tx/list';
import { TxRow } from '../tx/TxRow';
import { TxTabs } from '../tx/TxTabs';

const SEARCH_DEBOUNCE_MS = 200;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function TransactionsPage() {
  const location = useLocation();
  const today = useToday();
  const toast = useToast();
  const { openNew, openEdit, openRecurring } = useTxSheet();
  const { period, current } = useSelectedMonth();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categorySheet, setCategorySheet] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollTo = useRef<string | null>(null);

  // Özet'ten gelen filtre ve gün, "/" kısayolundan gelen arama isteği; her gezinmede bir kez.
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  if (appliedKey !== location.key) {
    setAppliedKey(location.key);
    const nav = readNavState(location.state);
    if (nav.type || nav.categoryId) {
      setFilters({ type: nav.type ?? 'all', categoryIds: new Set(nav.categoryId ? [nav.categoryId] : []) });
    }
    if (nav.search) setSearchOpen(true);
  }
  useEffect(() => {
    const nav = readNavState(location.state);
    if (nav.day) scrollTo.current = nav.day;
    if (nav.search) requestAnimationFrame(() => searchRef.current?.focus());
  }, [location.key, location.state]);

  const debouncedQuery = useDebounced(query, SEARCH_DEBOUNCE_MS);
  const searching = debouncedQuery.trim() !== '';
  const filtered = isFiltered(filters);

  const categoryMap = useCategoryMap();
  const monthTxs = useMonthTransactions(period);
  const allTxs = useAllTransactions(searching);
  const recurrings = useRecurrings();
  const totalCount = useTransactionCount();

  const visible = useMemo(() => {
    if (!categoryMap) return undefined;
    const source = searching ? allTxs : monthTxs;
    if (!source) return undefined;
    const found = searching ? searchTransactions(source, debouncedQuery, categoryMap) : source;
    return applyFilters(found, filters);
  }, [searching, allTxs, monthTxs, debouncedQuery, categoryMap, filters]);

  const planned = useMemo(
    () => (recurrings && !searching && !filtered && period >= current ? projectPlanned(recurrings, period, today) : []),
    [recurrings, searching, filtered, period, current, today],
  );

  useEffect(() => {
    const day = scrollTo.current;
    if (!day || !visible) return;
    scrollTo.current = null;
    document.getElementById(`gun-${day}`)?.scrollIntoView({ block: 'start' });
  }, [visible]);

  const remove = async (id: string) => {
    const removed = await deleteTransaction(db, id);
    if (removed) {
      toast({ message: copy.toast.deleted, action: { label: copy.toast.undo, onAction: () => void restoreTransaction(db, removed) } });
    }
  };

  const clearAll = () => {
    setFilters(NO_FILTERS);
    setQuery('');
    setSearchOpen(false);
  };

  const filterCategories = (categoryMap ? [...categoryMap.values()] : []).filter(
    (c) => filters.type === 'all' || c.type === filters.type,
  );
  const selectedNames = [...filters.categoryIds].map((id) => categoryMap?.get(id)?.name).filter(Boolean);
  const categoryChipLabel =
    selectedNames.length === 0
      ? copy.transactions.categoryChip
      : selectedNames.length === 1
        ? selectedNames[0]
        : copy.transactions.categoriesChip(selectedNames.length);

  const showSearchField = isDesktop || searchOpen;
  const summary = visible && (searching || filtered) ? filterSummary(visible) : null;

  const row = (t: Transaction, subtitle: (c: Category | undefined) => string) => {
    const c = categoryMap?.get(t.categoryId);
    return (
      <TxRow
        key={t.id}
        title={rowTitle(t, c)}
        subtitle={subtitle(c)}
        amount={t.amount}
        type={t.type}
        category={c}
        note={t.note}
        recurring={t.recurringId !== undefined}
        onOpen={() => openEdit(t.id)}
        onDelete={() => void remove(t.id)}
      />
    );
  };

  const searchField = (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface pr-1.5 pl-3 text-text-2 shadow-[inset_0_0_0_1px_var(--border)] lg:w-[300px] lg:flex-none">
      <Search size={18} aria-hidden="true" className="shrink-0" />
      <span className="sr-only">{copy.transactions.search}</span>
      <input
        ref={searchRef}
        type="search"
        value={query}
        placeholder={isDesktop ? copy.transactions.searchPlaceholderDesktop : copy.transactions.searchPlaceholder}
        className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text-2 [&::-webkit-search-cancel-button]:hidden"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isDesktop) {
            setQuery('');
            setSearchOpen(false);
          }
        }}
      />
      {query !== '' ? (
        <button
          type="button"
          aria-label={copy.transactions.clearSearch}
          className="hit-area flex size-8 items-center justify-center rounded-lg"
          onClick={() => {
            setQuery('');
            searchRef.current?.focus();
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : (
        isDesktop && <kbd className="rounded-md bg-surface-2 px-1.5 py-px font-sans text-xs leading-4">/</kbd>
      )}
    </label>
  );

  return (
    <Page>
      <header className="flex flex-col gap-3 lg:h-12 lg:flex-row lg:items-center lg:gap-6">
        <PageTitle>{copy.nav.transactions}</PageTitle>
        <TxTabs />
        {isDesktop && (
          <>
            <div className="flex-1" />
            {searchField}
          </>
        )}
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {!searching && !(searchOpen && !isDesktop) && (
          <div className="flex items-center justify-between gap-2">
            <MonthSwitcher />
            {!isDesktop && (
              <button
                type="button"
                aria-label={copy.transactions.search}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-text-2"
                onClick={() => {
                  setSearchOpen(true);
                  requestAnimationFrame(() => searchRef.current?.focus());
                }}
              >
                <Search size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {showSearchField && !isDesktop && (
          <div className="flex items-center gap-2">
            {searchField}
            <button
              type="button"
              className="h-11 shrink-0 px-1 font-medium text-accent"
              onClick={() => {
                setQuery('');
                setSearchOpen(false);
              }}
            >
              {copy.sheet.cancel}
            </button>
          </div>
        )}
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {(['all', 'income', 'expense'] as const).map((t) => (
            <Chip key={t} pressed={filters.type === t} onClick={() => setFilters((f) => ({ ...f, type: t, categoryIds: t === 'all' || t === f.type ? f.categoryIds : new Set() }))}>
              {t === 'all' ? copy.transactions.all : t === 'income' ? copy.type.income : copy.type.expense}
            </Chip>
          ))}
          <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border" />
          <Chip pressed={filters.categoryIds.size > 0} onClick={() => setCategorySheet(true)} className="pr-2.5">
            {categoryChipLabel}
            <ChevronDown size={16} aria-hidden="true" />
          </Chip>
          {filtered && (
            <button type="button" className="hit-area h-9 shrink-0 px-2 text-[13px] font-semibold text-accent" onClick={() => setFilters(NO_FILTERS)}>
              {copy.transactions.clear}
            </button>
          )}
        </div>
      </div>

      {summary && (
        <p className="m-0 px-1 text-[13px] leading-[18px] font-medium text-text-2 tabular-nums">
          {copy.transactions.summary(summary.count)} · <Amount kurus={summary.net} signed tone="plain" className="text-text" />
        </p>
      )}

      {planned.length > 0 && (
        <section className="flex flex-col gap-1 opacity-55">
          <div className="flex justify-between px-1 text-[13px] leading-[18px] font-medium text-text-2 sm:px-5">
            <span className="font-semibold">{copy.transactions.planned}</span>
            <span>{copy.transactions.plannedNote(planned.length)}</span>
          </div>
          <div className="rounded-2xl bg-surface px-4 py-1 sm:px-2">
            {planned.map((p) => {
              const c = categoryMap?.get(p.categoryId);
              return (
                <TxRow
                  key={p.recurringId}
                  title={rowTitle(p, c)}
                  subtitle={`${c?.name ?? ''} · ${shortDate(p.date)}`}
                  amount={p.amount}
                  type={p.type}
                  category={c}
                  recurring
                  onOpen={() => openRecurring(p.recurringId)}
                />
              );
            })}
          </div>
        </section>
      )}

      {visible && totalCount !== undefined && (
        <>
          {visible.length === 0 &&
            (searching || filtered ? (
              <EmptyState icon={SearchX} message={copy.transactions.noResults} action={{ label: copy.transactions.clearFilters, onClick: clearAll }} />
            ) : totalCount === 0 ? (
              <EmptyState icon={ListPlus} message={copy.transactions.emptyAll} action={{ label: copy.transactions.addFirst, onClick: () => openNew() }} />
            ) : (
              planned.length === 0 ? (
                <EmptyState
                  icon={ListPlus}
                  message={copy.transactions.emptyMonth(monthLabel(period))}
                  action={{ label: copy.transactions.add, onClick: () => openNew() }}
                />
              ) : null
            ))}

          {searching
            ? groupByMonth(visible).map((g) => (
                <section key={g.period} className="flex flex-col gap-1">
                  <div className="flex justify-between px-1 pt-1 sm:px-5">
                    <h2 className="m-0 text-[15px] leading-5 font-semibold">{monthLabel(g.period)}</h2>
                    <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.transactions.summary(g.items.length)}</span>
                  </div>
                  <div className="rounded-2xl bg-surface px-4 py-1 sm:px-2">
                    {g.items.map((t) => row(t, (c) => `${c?.name ?? ''} · ${shortDate(t.date)}`))}
                  </div>
                </section>
              ))
            : groupByDay(visible).map((g) => (
                <section key={g.date} id={`gun-${g.date}`} className="flex scroll-mt-4 flex-col gap-1">
                  <div className="flex justify-between px-1 text-[13px] leading-[18px] font-medium text-text-2 tabular-nums sm:px-5">
                    <h2 className="m-0 text-[13px] leading-[18px] font-semibold">{dayHeading(g.date, today)}</h2>
                    <Amount kurus={g.net} signed tone="plain" />
                  </div>
                  <div className="rounded-2xl bg-surface px-4 py-1 sm:px-2">{g.items.map((t) => row(t, (c) => c?.name ?? ''))}</div>
                </section>
              ))}
        </>
      )}

      {categorySheet && (
        <CategoryFilterSheet
          categories={filterCategories}
          selected={filters.categoryIds}
          onChange={(categoryIds) => setFilters((f) => ({ ...f, categoryIds }))}
          onClose={() => setCategorySheet(false)}
        />
      )}
    </Page>
  );
}
