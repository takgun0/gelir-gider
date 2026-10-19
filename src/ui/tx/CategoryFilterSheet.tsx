// "Kategori" çipinin çoklu seçimli alt sayfası (DESIGN §6.2).
import { Check } from 'lucide-react';
import { sortForGrid } from '../../domain/categories';
import type { Category } from '../../domain/types';
import { Button } from '../components/Button';
import { CategoryIcon } from '../components/CategoryIcon';
import { Sheet } from '../components/Sheet';
import { copy } from '../copy';

interface CategoryFilterSheetProps {
  categories: readonly Category[];
  selected: ReadonlySet<string>;
  onChange: (ids: Set<string>) => void;
  onClose: () => void;
}

export function CategoryFilterSheet({ categories, selected, onChange, onClose }: CategoryFilterSheetProps) {
  const sections = (['expense', 'income'] as const)
    .map((type) => ({ type, items: sortForGrid(categories.filter((c) => c.type === type)) }))
    .filter((s) => s.items.length > 0);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <Sheet title={copy.transactions.categoryChip} onRequestClose={onClose} footer={<Button onClick={onClose}>{copy.transactions.done}</Button>}>
      <div className="flex flex-col gap-4 pb-2">
        {sections.map(({ type, items }) => (
          <div key={type} role="group" aria-label={type === 'expense' ? copy.type.expense : copy.type.income} className="flex flex-col">
            {sections.length > 1 && (
              <span className="pb-1 text-xs leading-4 font-semibold text-text-2">{type === 'expense' ? copy.type.expense : copy.type.income}</span>
            )}
            {items.map((c) => {
              const on = selected.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  className="flex h-14 items-center gap-3 rounded-xl text-left"
                  onClick={() => toggle(c.id)}
                >
                  <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  <span
                    aria-hidden="true"
                    className={`flex size-6 items-center justify-center rounded-md ${on ? 'bg-accent text-on-accent' : 'shadow-[inset_0_0_0_2px_var(--border)]'}`}
                  >
                    {on && <Check size={16} strokeWidth={2.5} />}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
