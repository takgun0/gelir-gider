// Kategori ekle/düzenle (DESIGN §6.4): canlı önizleme, ad, 14 renk, gruplu ikonlar.
import { Search } from 'lucide-react';
import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_ICON, NAME_MAX, defaultColor, validateCategoryName } from '../../domain/categories';
import { PALETTE_KEYS, type Category, type IconKey, type PaletteKey, type TxType } from '../../domain/types';
import { contextFrom } from '../../db/context';
import { db } from '../../db/db';
import { addCategory, updateCategory } from '../../db/ops/categories';
import { Button } from '../components/Button';
import { CategoryIcon } from '../components/CategoryIcon';
import { categoryColorStyle } from '../components/category-style';
import { FieldError, FieldLabel } from '../components/controls';
import { Sheet } from '../components/Sheet';
import { copy } from '../copy';
import { useCategories } from '../data';
import { ICON_GROUPS, searchIcons } from '../icons';

interface CategoryEditorProps {
  /** Düzenlenecek kategori; yoksa yeni kategori */
  category?: Category | undefined;
  /** Yeni kategoride tür */
  type: TxType;
  onClose: () => void;
  onSaved: (id: string) => void;
  /** Düzenlemede en altta (ör. "Bu kategorinin işlemleri →", "Kategoriyi sil") */
  footerLinks?: ReactNode;
}

export function CategoryEditor({ category, type, onClose, onSaved, footerLinks }: CategoryEditorProps) {
  const categories = useCategories() ?? [];
  const kind = category?.type ?? type;
  const [name, setName] = useState(category?.name ?? '');
  // Yeni kategoride varsayılan renk kategoriler yüklenince hesaplanır.
  const [chosenColor, setColor] = useState<PaletteKey | null>(category?.color ?? null);
  const color = chosenColor ?? defaultColor(categories, kind);
  const [icon, setIcon] = useState<IconKey>(category?.icon ?? DEFAULT_ICON);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const colorLabelId = useId();
  const iconLabelId = useId();

  const groups = useMemo(() => {
    const found = searchIcons(query);
    return ICON_GROUPS.map((group) => ({ group, icons: found.filter((e) => e.group === group) })).filter((g) => g.icons.length > 0);
  }, [query]);

  const save = async () => {
    const all = await db.categories.toArray();
    const problem = validateCategoryName(name, kind, all, category?.id);
    if (problem) {
      setError(problem === 'duplicateName' ? copy.errors.categoryNameDuplicate : copy.errors.categoryNameEmpty);
      nameRef.current?.focus();
      return;
    }
    const input = { name, color, icon };
    if (category) {
      await updateCategory(db, category.id, input);
      onSaved(category.id);
    } else {
      onSaved(await addCategory(db, kind, input, contextFrom()));
    }
  };

  return (
    <Sheet
      title={category ? copy.categoryEditor.editTitle : copy.categoryEditor.newTitle}
      onRequestClose={onClose}
      initialFocusRef={category ? undefined : nameRef}
      footer={
        <Button type="submit" form={`${nameId}-form`}>
          {copy.sheet.save}
        </Button>
      }
    >
      <form
        id={`${nameId}-form`}
        className="flex flex-col gap-6 pb-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="flex flex-col items-center gap-2 pt-2">
          <CategoryIcon icon={icon} color={color} size="lg" />
          <span className="min-h-[22px] max-w-full truncate text-[17px] leading-[22px] font-semibold">{name.trim()}</span>
          <span className="text-[13px] leading-[18px] font-medium text-text-2">
            {copy.categoryEditor.typeLocked(kind === 'expense' ? copy.type.expense : copy.type.income)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <FieldLabel htmlFor={nameId}>{copy.categoryEditor.name}</FieldLabel>
            <span className="text-[13px] leading-[18px] font-medium text-text-2 tabular-nums">
              {name.length}/{NAME_MAX}
            </span>
          </div>
          <input
            ref={nameRef}
            id={nameId}
            type="text"
            maxLength={NAME_MAX}
            value={name}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${nameId}-error` : undefined}
            className={`h-12 rounded-xl bg-surface-2 px-3.5 text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-0 ${
              error ? 'outline-2 outline-expense' : 'focus-visible:outline-accent'
            }`}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
          {error && <FieldError id={`${nameId}-error`}>{error}</FieldError>}
        </div>

        <div className="flex flex-col gap-2">
          <span id={colorLabelId} className="text-[13px] leading-[18px] font-medium text-text-2">
            {copy.categoryEditor.color}
          </span>
          <div role="radiogroup" aria-labelledby={colorLabelId} className="grid grid-cols-7 justify-items-center gap-y-3">
            {PALETTE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={key === color}
                aria-label={copy.palette[key]}
                style={categoryColorStyle(key)}
                className={`size-9 rounded-full bg-[var(--cat)] ${
                  key === color ? 'shadow-[0_0_0_3px_var(--surface),0_0_0_5px_var(--text)]' : ''
                }`}
                onClick={() => setColor(key)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span id={iconLabelId} className="text-[13px] leading-[18px] font-medium text-text-2">
            {copy.categoryEditor.icon}
          </span>
          <label className="flex h-11 items-center gap-2 rounded-xl bg-surface-2 px-3 text-text-2">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">{copy.categoryEditor.iconSearch}</span>
            <input
              type="search"
              value={query}
              placeholder={copy.categoryEditor.iconSearchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text-2"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
          </label>
          {groups.length === 0 && <p className="m-0 text-text-2">{copy.categoryEditor.noIcons}</p>}
          {groups.map(({ group, icons }) => (
            <div key={group} role="group" aria-label={group} className="flex flex-col gap-2">
              <span className="text-xs leading-4 font-semibold text-text-2">{group}</span>
              <div className="grid grid-cols-6 gap-2">
                {icons.map(({ key, component: Icon, label }) => {
                  const selected = key === icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={label}
                      aria-pressed={selected}
                      style={categoryColorStyle(color)}
                      className={`flex aspect-square items-center justify-center rounded-xl ${
                        selected
                          ? 'bg-[color-mix(in_srgb,var(--cat)_16%,transparent)] text-[var(--cat)] shadow-[inset_0_0_0_2px_var(--accent)]'
                          : 'bg-surface-2 text-text'
                      }`}
                      onClick={() => setIcon(key)}
                    >
                      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {footerLinks}
      </form>
    </Sheet>
  );
}
