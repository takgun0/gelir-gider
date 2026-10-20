// Özet'te açık borç ve alacaklar (Tasarım §6.8): yalnızca açık kayıt varken görünür.
import { CircleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { debtStatus, openTotals } from '../../domain/debts';
import type { DateStr, Debt } from '../../domain/types';
import { Amount } from '../components/Amount';
import { copy } from '../copy';

export function DebtsCard({ debts, today }: { debts: readonly Debt[]; today: DateStr }) {
  const t = openTotals(debts);
  if (t.payableCount + t.receivableCount === 0) return null;
  const overdue = debts.filter((d) => debtStatus(d, today) === 'overdue').length;
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-2xl bg-surface p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[15px] leading-5 font-semibold">{copy.debts.summaryTitle}</h2>
        <Link to="/islemler/borclar" className="hit-area py-1 text-[13px] leading-[18px] font-semibold text-accent">
          {copy.summary.all}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] leading-[18px] font-medium text-text-2">
            {copy.debts.payableTitle} · {copy.debts.count(t.payableCount)}
          </span>
          <Amount kurus={t.payable} type="expense" className="text-base leading-[22px] font-semibold" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] leading-[18px] font-medium text-text-2">
            {copy.debts.receivableTitle} · {copy.debts.count(t.receivableCount)}
          </span>
          <Amount kurus={t.receivable} type="income" className="text-base leading-[22px] font-semibold" />
        </div>
      </div>
      {overdue > 0 && (
        <p className="m-0 flex items-center gap-2 text-[13px] leading-[18px] font-medium text-expense">
          <CircleAlert size={16} aria-hidden="true" />
          {copy.debts.overdueWarning(overdue)}
        </p>
      )}
    </section>
  );
}
