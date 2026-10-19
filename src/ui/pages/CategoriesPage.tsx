// Kategoriler (Tasarım §6.4): düzenleme yeri ve "paramı nereye harcadım" sorusunun
// kategori bazlı cevabı. Toplamlar seçili aya göre.
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSelectedMonth } from '../../app/month';
import type { TransactionsNavState } from '../../app/nav-state';
import { useToast } from '../../app/toast';
import { findSystemCategory } from '../../domain/categories';
import { sortByUsage, totalsByCategory } from '../../domain/stats';
import type { Category, TxType } from '../../domain/types';
import { db } from '../../db/db';
import { categoryUsage, deleteCategory } from '../../db/ops/categories';
import { CategoryEditor } from '../categories/CategoryEditor';
import { Amount } from '../components/Amount';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Segmented } from '../components/controls';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { Page, PageTitle } from '../components/Page';
import { copy } from '../copy';
import { useCategories, useMonthTransactions } from '../data';

interface DeleteRequest {
  category: Category;
  target: Category;
  transactions: number;
  recurrings: number;
}

export function CategoriesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { period } = useSelectedMonth();
  const [type, setType] = useState<TxType>('expense');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [deleting, setDeleting] = useState<DeleteRequest | null>(null);
  const categories = useCategories();
  const monthTxs = useMonthTransactions(period);

  const view = useMemo(() => {
    if (!categories || !monthTxs) return null;
    const ofType = monthTxs.filter((t) => t.type === type);
    const sums = totalsByCategory(ofType);
    const total = ofType.reduce((s, t) => s + t.amount, 0);
    const list = sortByUsage(
      categories.filter((c) => c.type === type),
      sums,
    );
    return { sums, total, list };
  }, [categories, monthTxs, type]);

  const askDelete = async (category: Category) => {
    const target = findSystemCategory(categories ?? [], category.type);
    if (!target) return;
    const usage = await categoryUsage(db, category.id);
    setDeleting({ category, target, ...usage });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const moved = await deleteCategory(db, deleting.category.id);
    const usage = copy.categories.usage(moved.transactions, moved.recurrings);
    setDeleting(null);
    setEditing(null);
    toast({ message: usage ? copy.categories.deletedMoved(usage, deleting.target.name) : copy.categories.deleted });
  };

  const editingCategory = editing !== null && editing !== 'new' ? editing : undefined;

  return (
    <Page>
      <header className="flex flex-col gap-3">
        <PageTitle>{copy.nav.categories}</PageTitle>
        <div className="lg:w-60">
          <Segmented<TxType>
            label={copy.type.label}
            value={type}
            options={[
              { value: 'expense', label: copy.type.expense },
              { value: 'income', label: copy.type.income },
            ]}
            onChange={setType}
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <MonthSwitcher />
        {view && (
          <span className="text-[13px] leading-[18px] font-medium text-text-2 tabular-nums">
            {copy.categories.total} <Amount kurus={view.total} type={type} tone="plain" className="font-semibold text-text" />
          </span>
        )}
      </div>

      {view && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {view.list.map((c) => {
            const sum = view.sums.get(c.id) ?? 0;
            const ratio = view.total > 0 ? sum / view.total : 0;
            return (
              <button
                key={c.id}
                type="button"
                className="flex flex-col gap-3 rounded-2xl bg-surface p-4 text-left"
                onClick={() => setEditing(c)}
              >
                <CategoryIcon icon={c.icon} color={c.color} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[13px] leading-[18px] font-medium text-text-2">{c.name}</span>
                  {sum > 0 ? (
                    <Amount kurus={sum} type={type} tone="plain" className="text-base leading-[22px] font-semibold" />
                  ) : (
                    <span className="text-base leading-[22px] font-semibold text-text-2">{copy.categories.unused}</span>
                  )}
                </span>
                <span aria-hidden="true" className="flex h-1 rounded-sm bg-surface-2">
                  {sum > 0 && (
                    <span
                      className={`rounded-sm ${type === 'expense' ? 'bg-expense-chart' : 'bg-income-chart'}`}
                      style={{ width: `${Math.max(2, Math.round(ratio * 100))}%` }}
                    />
                  )}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 font-semibold text-text-2"
            onClick={() => setEditing('new')}
          >
            <Plus size={22} strokeWidth={1.75} aria-hidden="true" />
            {copy.categories.add}
          </button>
        </div>
      )}

      {editing !== null && (
        <CategoryEditor
          category={editingCategory}
          type={type}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
          footerLinks={
            editingCategory && (
              <div className="flex flex-col items-start gap-1 border-t border-border pt-4">
                <button
                  type="button"
                  className="py-2 font-semibold text-accent"
                  onClick={() => {
                    const state: TransactionsNavState = { type: editingCategory.type, categoryId: editingCategory.id };
                    setEditing(null);
                    void navigate('/islemler', { state });
                  }}
                >
                  {copy.categories.transactionsLink}
                </button>
                {!editingCategory.isSystem && (
                  <button type="button" className="py-2 font-semibold text-expense" onClick={() => void askDelete(editingCategory)}>
                    {copy.categories.delete}
                  </button>
                )}
              </div>
            )
          }
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={copy.categories.deleteTitle(deleting.category.name)}
          message={
            deleting.transactions + deleting.recurrings > 0
              ? copy.categories.deleteBody(
                  deleting.category.name,
                  copy.categories.usage(deleting.transactions, deleting.recurrings),
                  deleting.target.name,
                )
              : undefined
          }
          confirmLabel={deleting.transactions + deleting.recurrings > 0 ? copy.categories.moveAndDelete : copy.categories.deleteConfirm}
          cancelLabel={copy.sheet.cancel}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </Page>
  );
}
