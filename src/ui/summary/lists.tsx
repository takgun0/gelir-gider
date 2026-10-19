// Özet listeleri (DESIGN §6.1 madde 8–9): yaklaşan ya da planlanan sabit işlemler ve son işlemler.
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { dayMonth, dayHeading, diffDays, shortDate } from '../../domain/date';
import type { PlannedItem } from '../../domain/recurring';
import type { Category, DateStr, Transaction } from '../../domain/types';
import { Amount } from '../components/Amount';
import { CategoryIcon } from '../components/CategoryIcon';
import { copy } from '../copy';
import { rowTitle } from '../tx/list';
import { TxRow } from '../tx/TxRow';

function Card({ title, link, children }: { title: string; link?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-1 rounded-2xl bg-surface px-4 pt-4 pb-3 lg:px-6 lg:pt-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="m-0 text-[15px] leading-5 font-semibold">{title}</h2>
        {link && (
          <Link to={link.to} className="hit-area py-1 text-[13px] leading-[18px] font-semibold text-accent">
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

interface PlannedListProps {
  title: string;
  note?: string;
  items: PlannedItem[];
  categories: ReadonlyMap<string, Category>;
  today: DateStr;
  /** Yaklaşanlarda "7 gün sonra" eklenir. */
  relative: boolean;
  empty?: string;
  onOpen: (recurringId: string) => void;
}

export function PlannedList({ title, note, items, categories, today, relative, empty, onOpen }: PlannedListProps) {
  return (
    <Card title={title} link={{ to: '/islemler/sabit', label: copy.summary.all }}>
      {note && <p className="m-0 mb-1 text-[13px] leading-[18px] font-medium text-text-2">{note}</p>}
      {items.length === 0 && empty && <p className="m-0 py-3 text-text-2">{empty}</p>}
      {items.map((p) => {
        const c = categories.get(p.categoryId);
        return (
          <button
            key={`${p.recurringId}-${p.period}`}
            type="button"
            className="flex h-16 items-center gap-3 text-left"
            onClick={() => onOpen(p.recurringId)}
          >
            {c && <CategoryIcon icon={c.icon} color={c.color} />}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{rowTitle(p, c)}</span>
              <span className="text-[13px] leading-[18px] font-medium text-text-2">
                {relative ? copy.summary.inDays(dayMonth(p.date), diffDays(today, p.date)) : dayMonth(p.date)}
              </span>
            </span>
            <Amount kurus={p.amount} type={p.type} className="text-base leading-[22px] font-semibold" />
          </button>
        );
      })}
    </Card>
  );
}

interface RecentListProps {
  items: Transaction[];
  categories: ReadonlyMap<string, Category>;
  today: DateStr;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RecentList({ items, categories, today, onOpen, onDelete }: RecentListProps) {
  const when = (date: DateStr) => {
    const heading = dayHeading(date, today);
    return heading === 'Bugün' || heading === 'Dün' ? heading : shortDate(date);
  };
  return (
    <Card title={copy.summary.recent}>
      {items.map((t) => {
        const c = categories.get(t.categoryId);
        return (
          <TxRow
            key={t.id}
            title={rowTitle(t, c)}
            subtitle={`${c?.name ?? ''} · ${when(t.date)}`}
            amount={t.amount}
            type={t.type}
            category={c}
            note={t.note}
            recurring={t.recurringId !== undefined}
            onOpen={() => onOpen(t.id)}
            onDelete={() => onDelete(t.id)}
          />
        );
      })}
      <Link to="/islemler" className="self-center px-4 py-3 text-[13px] leading-[18px] font-semibold text-accent">
        {copy.summary.seeAll}
      </Link>
    </Card>
  );
}
