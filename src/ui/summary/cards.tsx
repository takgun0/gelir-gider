// Özet üst bölümü (DESIGN §6.1 madde 2–4): Kalan, gelir/gider kartları, bugün · bu hafta.
import { ArrowDown } from 'lucide-react';
import { ArrowUp } from 'lucide-react';
import type { TxType } from '../../domain/types';
import { Amount } from '../components/Amount';
import { copy } from '../copy';

function Badge({ tone, children }: { tone: 'expense' | 'neutral'; children: string }) {
  return (
    <span
      className={`rounded-[10px] px-2 py-0.5 text-xs leading-4 font-semibold ${
        tone === 'expense' ? 'bg-expense-soft text-expense' : 'bg-surface-2 text-text-2'
      }`}
    >
      {children}
    </span>
  );
}

interface HeroCardProps {
  monthName: string;
  net: number;
  planned: boolean;
  /** Yalnızca içinde bulunulan ayda */
  forecast: number | null;
}

export function HeroCard({ monthName, net, planned, forecast }: HeroCardProps) {
  return (
    <section className="flex flex-col gap-1.5 rounded-2xl bg-surface p-5 lg:col-span-2 lg:gap-2 lg:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-[13px] leading-[18px] font-medium text-text-2">{copy.summary.remaining(monthName)}</h2>
        {net < 0 && <Badge tone="expense">{copy.summary.negative}</Badge>}
        {planned && <Badge tone="neutral">{copy.summary.planned}</Badge>}
      </div>
      <Amount kurus={net} signed variant="hero" />
      {forecast !== null && (
        <p className="m-0 text-[13px] leading-[18px] font-medium text-text-2 tabular-nums">
          {copy.summary.forecast} <Amount kurus={forecast} tone="plain" className={forecast < 0 ? 'text-expense' : 'text-text'} />
        </p>
      )}
    </section>
  );
}

interface TotalCardProps {
  type: TxType;
  amount: number;
  planned: boolean;
  onOpen: () => void;
}

export function TotalCard({ type, amount, planned, onOpen }: TotalCardProps) {
  const Icon = type === 'income' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      className="flex flex-col gap-2.5 rounded-2xl bg-surface p-4 text-left lg:justify-between lg:gap-3 lg:p-6"
      onClick={onOpen}
    >
      <span className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex size-6 items-center justify-center rounded-full ${
            type === 'income' ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense'
          }`}
        >
          <Icon size={14} strokeWidth={2.25} />
        </span>
        <span className="text-[13px] leading-[18px] font-medium text-text-2">
          {type === 'income' ? copy.type.income : copy.type.expense}
        </span>
        {planned && <Badge tone="neutral">{copy.summary.planned}</Badge>}
      </span>
      <Amount kurus={amount} type={type} className="text-xl leading-7 font-semibold tracking-[-0.01em] lg:text-[22px]" />
    </button>
  );
}

export function TodayWeekLine({ today, week }: { today: number; week: number }) {
  return (
    <p className="m-0 flex flex-wrap justify-center gap-x-2 px-1 text-[13px] leading-[18px] font-medium text-text-2 tabular-nums lg:justify-start">
      <span>
        {copy.summary.today} <Amount kurus={-today} signed tone="plain" className="text-text" />
      </span>
      <span aria-hidden="true">·</span>
      <span>
        {copy.summary.thisWeek} <Amount kurus={-week} signed tone="plain" className="text-text" />
      </span>
    </p>
  );
}

/** İlk açılış: özgün, satır içi çizgi illüstrasyon (SPEC §6 "Diğer"). */
export function Welcome({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="flex flex-col items-center gap-6 px-6 pt-10 pb-6 text-center">
      <svg
        aria-hidden="true"
        width="168"
        height="128"
        viewBox="0 0 168 128"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-text-2"
      >
        <rect x="28" y="34" width="112" height="72" rx="14" />
        <path d="M28 54h112" />
        <rect x="104" y="64" width="36" height="22" rx="8" className="text-accent" stroke="var(--accent)" />
        <circle cx="116" cy="75" r="3" fill="var(--accent)" stroke="none" />
        <path d="M44 22l20-12 26 14" />
        <circle cx="132" cy="20" r="9" stroke="var(--income)" />
        <path d="M132 15v10M128.5 18.5h5a2 2 0 0 1 0 4h-5" stroke="var(--income)" strokeWidth="1.5" />
        <path d="M44 84h28M44 94h18" />
      </svg>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-[22px] leading-7 font-semibold">{copy.summary.welcomeTitle}</h2>
        <p className="m-0 max-w-[300px] text-text-2">{copy.summary.welcomeBody}</p>
      </div>
      <button
        type="button"
        className="h-[52px] rounded-xl bg-accent px-6 text-base font-semibold text-on-accent active:brightness-90"
        onClick={onAdd}
      >
        {copy.summary.welcomeAction}
      </button>
    </section>
  );
}
