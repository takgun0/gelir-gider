// İşlemler › Borçlar (Tasarım §6.8): başkasına borçların ve senden alacaklılar.
// Satırdaki daireye dokununca kayıt ödendi olarak işaretlenir ("Geri al" ile).
import { Check } from 'lucide-react';
import { Handshake } from 'lucide-react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToday } from '../../app/today';
import { useToast } from '../../app/toast';
import { shortDate } from '../../domain/date';
import { daysOverdue, debtStatus, groupDebts, openTotals } from '../../domain/debts';
import type { Debt } from '../../domain/types';
import { contextFrom } from '../../db/context';
import { db } from '../../db/db';
import { restoreDebt, setDebtPaid } from '../../db/ops/debts';
import { Amount } from '../components/Amount';
import { EmptyState } from '../components/EmptyState';
import { Page, PageTitle } from '../components/Page';
import { copy } from '../copy';
import { useDebts } from '../data';
import { DebtForm } from '../debts/DebtForm';
import { TxTabs } from '../tx/TxTabs';

function subtitle(d: Debt, today: string): { text: string; warn: boolean } {
  const parts: string[] = [];
  if (d.description) parts.push(d.description);
  const status = debtStatus(d, today);
  let warn = false;
  if (status === 'paid' && d.paidOn) parts.push(copy.debts.paidOn(shortDate(d.paidOn)));
  else if (status === 'overdue') {
    parts.push(copy.debts.overdue(daysOverdue(d, today)));
    warn = true;
  } else if (status === 'dueToday') {
    parts.push(copy.debts.dueToday);
    warn = true;
  } else if (d.dueDate) parts.push(copy.debts.due(shortDate(d.dueDate)));
  return { text: parts.join(' · '), warn };
}

export function DebtsPage() {
  const today = useToday();
  const toast = useToast();
  const debts = useDebts();
  const [editing, setEditing] = useState<Debt | 'new' | null>(null);

  const groups = useMemo(() => (debts ? groupDebts(debts) : null), [debts]);
  const totals = debts ? openTotals(debts) : null;

  const togglePaid = async (d: Debt) => {
    const before = await setDebtPaid(db, d.id, d.paidOn === undefined ? today : null, contextFrom());
    toast({
      message: d.paidOn === undefined ? copy.debts.paidToast : copy.debts.reopenedToast,
      action: { label: copy.toast.undo, onAction: () => void restoreDebt(db, before) },
    });
  };

  const row = (d: Debt) => {
    const paid = d.paidOn !== undefined;
    const sub = subtitle(d, today);
    const payable = d.direction === 'payable';
    return (
      <div key={d.id} className="flex min-h-16 items-center gap-3 py-2">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 self-stretch text-left" onClick={() => setEditing(d)}>
          <span
            aria-hidden="true"
            className={`flex size-10 shrink-0 items-center justify-center rounded-full font-semibold ${
              payable ? 'bg-expense-soft text-expense' : 'bg-income-soft text-income'
            }`}
          >
            {d.person.trim().charAt(0).toLocaleUpperCase('tr-TR')}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{d.person}</span>
            {sub.text && (
              <span className={`text-[13px] leading-[18px] font-medium ${sub.warn ? 'text-expense' : 'text-text-2'}`}>{sub.text}</span>
            )}
          </span>
          <Amount kurus={d.amount} type={payable ? 'expense' : 'income'} tone={paid ? 'plain' : 'auto'} className="text-base leading-[22px] font-semibold" />
        </button>
        <button
          type="button"
          aria-label={`${d.person}: ${paid ? copy.debts.markUnpaid : copy.debts.markPaid}`}
          aria-pressed={paid}
          className={`hit-area flex size-8 shrink-0 items-center justify-center rounded-full ${
            paid ? 'bg-accent text-on-accent' : 'text-transparent shadow-[inset_0_0_0_2px_var(--border)] hover:text-text-2'
          }`}
          onClick={() => void togglePaid(d)}
        >
          <Check size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    );
  };

  const section = (title: string, list: Debt[], faded = false) =>
    list.length > 0 && (
      <section className="flex flex-col gap-1">
        <div className="flex justify-between px-1 text-[13px] leading-[18px] font-medium text-text-2 sm:px-5">
          <h2 className="m-0 text-[13px] leading-[18px] font-semibold">{title}</h2>
          <span>{copy.debts.count(list.length)}</span>
        </div>
        <div className={`rounded-2xl bg-surface px-4 py-1 ${faded ? 'opacity-55' : ''}`}>{list.map(row)}</div>
      </section>
    );

  return (
    <Page>
      <header className="flex flex-col gap-3 lg:h-12 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex items-center justify-between">
          <PageTitle>{copy.nav.transactions}</PageTitle>
          <button
            type="button"
            className="flex h-10 items-center gap-1 rounded-xl px-2 font-semibold text-accent lg:hidden"
            onClick={() => setEditing('new')}
          >
            <Plus size={18} aria-hidden="true" />
            {copy.debts.add}
          </button>
        </div>
        <TxTabs />
        <div className="hidden flex-1 lg:block" />
        <button
          type="button"
          className="hidden h-10 items-center gap-1 rounded-xl px-2 font-semibold text-accent lg:flex"
          onClick={() => setEditing('new')}
        >
          <Plus size={18} aria-hidden="true" />
          {copy.debts.add}
        </button>
      </header>

      {debts && debts.length === 0 && (
        <EmptyState icon={Handshake} message={copy.debts.empty} action={{ label: copy.debts.emptyAction, onClick: () => setEditing('new') }} />
      )}

      {groups && totals && debts && debts.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-surface p-4">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.debts.payableTitle}</span>
              <Amount kurus={totals.payable} type="expense" className="text-base leading-[22px] font-semibold" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.debts.receivableTitle}</span>
              <Amount kurus={totals.receivable} type="income" className="text-base leading-[22px] font-semibold" />
            </div>
          </div>
          {section(copy.debts.payableTitle, groups.payable)}
          {section(copy.debts.receivableTitle, groups.receivable)}
          {section(copy.debts.paidTitle, groups.paid, true)}
        </>
      )}

      {editing !== null && (
        <DebtForm key={editing === 'new' ? 'new' : editing.id} debt={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </Page>
  );
}
