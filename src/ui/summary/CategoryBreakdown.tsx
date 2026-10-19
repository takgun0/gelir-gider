// Kategori dağılımı (Tasarım §6.1 madde 6): Gider/Gelir anahtarı, donut ve liste.
// Liste donut'un metin karşılığıdır; dilimler arasında 2 px yüzey boşluğu.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Cell, Pie, PieChart } from 'recharts';
import type { TransactionsNavState } from '../../app/nav-state';
import { useMediaQuery } from '../../app/viewport';
import { formatPercent } from '../../domain/format';
import { categoryBreakdown } from '../../domain/stats';
import type { Category, Transaction, TxType } from '../../domain/types';
import { Amount } from '../components/Amount';
import { Segmented } from '../components/controls';
import { copy } from '../copy';
import { useWidth } from '../charts/useWidth';

const OTHERS_COLOR = 'color-mix(in srgb, var(--text-2) 45%, var(--surface))';

interface CategoryBreakdownProps {
  transactions: readonly Transaction[];
  categories: ReadonlyMap<string, Category>;
}

interface Row {
  key: string;
  name: string;
  amount: number;
  ratio: number;
  color: string;
  categoryId: string | null;
}

export function CategoryBreakdown({ transactions, categories }: CategoryBreakdownProps) {
  const navigate = useNavigate();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [type, setType] = useState<TxType>('expense');
  const [expanded, setExpanded] = useState(false);
  const [donutRef, donutWidth] = useWidth<HTMLDivElement>();
  // Donut 176 px; dar ekranda ya da büyük yazı boyutunda kabına sığacak kadar küçülür.
  const size = Math.min(176, donutWidth || 176);
  const k = size / 176;

  const nameOf = (id: string) => categories.get(id)?.name ?? '';
  const breakdown = categoryBreakdown(transactions, type, nameOf);

  const toRow = (s: { categoryId: string; amount: number; ratio: number }): Row => {
    const c = categories.get(s.categoryId);
    return {
      key: s.categoryId,
      name: c?.name ?? '',
      amount: s.amount,
      ratio: s.ratio,
      color: c ? `var(--c-${c.color})` : OTHERS_COLOR,
      categoryId: s.categoryId,
    };
  };

  const sliceRows = breakdown.slices.map(toRow);
  if (breakdown.others) {
    sliceRows.push({
      key: 'others',
      name: copy.summary.others(breakdown.others.count),
      amount: breakdown.others.amount,
      ratio: breakdown.others.ratio,
      color: OTHERS_COLOR,
      categoryId: null,
    });
  }
  // "Tümünü göster": tüm kategoriler tek tek listelenir (donut aynı kalır).
  const listRows = expanded ? categoryBreakdown(transactions, type, nameOf, Infinity).slices.map(toRow) : sliceRows;

  const openCategory = (categoryId: string | null) => {
    if (categoryId === null) {
      setExpanded(true);
      return;
    }
    const state: TransactionsNavState = { type, categoryId };
    void navigate('/islemler', { state });
  };

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl bg-surface p-4 lg:gap-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[15px] leading-5 font-semibold">{copy.summary.breakdown}</h2>
        <Segmented<TxType>
          size="sm"
          label={copy.type.label}
          value={type}
          options={[
            { value: 'expense', label: copy.type.expense },
            { value: 'income', label: copy.type.income },
          ]}
          onChange={(t) => {
            setType(t);
            setExpanded(false);
          }}
        />
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-7">
        <div ref={donutRef} className="relative aspect-square w-44 max-w-full min-w-0 shrink overflow-hidden" aria-hidden="true">
          <PieChart width={size} height={size} accessibilityLayer={false}>
            {breakdown.total > 0 ? (
              <Pie
                data={sliceRows}
                dataKey="amount"
                nameKey="name"
                innerRadius={58 * k}
                outerRadius={80 * k}
                startAngle={90}
                endAngle={-270}
                stroke="var(--surface)"
                strokeWidth={2}
                isAnimationActive={!reduceMotion} animationDuration={400}
                onClick={(_, index) => openCategory(sliceRows[index]?.categoryId ?? null)}
                className="cursor-pointer"
              >
                {sliceRows.map((r) => (
                  <Cell key={r.key} fill={r.color} />
                ))}
              </Pie>
            ) : (
              <Pie data={[{ amount: 1 }]} dataKey="amount" innerRadius={58 * k} outerRadius={80 * k} fill="var(--surface-2)" stroke="none" isAnimationActive={false} />
            )}
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-[14%] text-center">
            <span className="text-xs leading-4 font-medium text-text-2">
              {type === 'expense' ? copy.summary.totalExpense : copy.summary.totalIncome}
            </span>
            <Amount kurus={breakdown.total} type={type} tone="plain" className="text-[15px] leading-5 font-semibold" />
          </div>
        </div>
        {listRows.length > 0 && (
          <ul className="m-0 flex w-full min-w-0 list-none flex-col p-0 sm:flex-1">
            {listRows.map((r) => (
              <li key={r.key}>
                <button type="button" className="flex min-h-10 w-full flex-wrap items-center gap-x-2.5 text-left" onClick={() => openCategory(r.categoryId)}>
                  <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                  <span className="min-w-12 flex-1 truncate">{r.name}</span>
                  <Amount kurus={r.amount} tone="plain" className="font-semibold" />
                  <span className="w-10 text-right text-[13px] leading-[18px] font-medium text-text-2 tabular-nums">
                    {formatPercent(r.ratio)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {breakdown.others && !expanded && (
        <button
          type="button"
          className="hit-area self-start py-1 text-[13px] leading-[18px] font-semibold text-accent sm:self-end"
          onClick={() => setExpanded(true)}
        >
          {copy.summary.showAll}
        </button>
      )}
    </section>
  );
}
