// İşlem ekle/düzenle ve sabit işlemi düzenle formu (Tasarım §6.3, §6.5).
// Hedef: sık yapılan bir gideri, tutar dışında üç dokunuşla kaydetmek.
import { CalendarDays } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Repeat } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { kurusToInput, type AmountInputState } from '../../domain/amount-input';
import { sortForGrid } from '../../domain/categories';
import { addDays, addMonths, dayMonth, dayOfMonth, monthLabel, shortDate } from '../../domain/date';
import { MAX_AMOUNT } from '../../domain/money';
import { firstRepeatPeriod, isValidEndPeriod, occurrenceDate, repeatSummary } from '../../domain/recurring';
import type { DateStr, Period, Recurring, Transaction, TxType } from '../../domain/types';
import { contextFrom } from '../../db/context';
import { db } from '../../db/db';
import { countRecurringInstances, deleteRecurring, undoDeleteRecurring, updateRecurring } from '../../db/ops/recurrings';
import {
  addTransaction,
  deleteTransaction,
  restoreTransaction,
  updateTransaction,
} from '../../db/ops/transactions';
import { DESCRIPTION_MAX, NOTE_MAX } from '../../db/ops/validate';
import { requestPersistentStorage } from '../../app/persist';
import { useToday } from '../../app/today';
import { useToast } from '../../app/toast';
import { AmountField } from '../components/AmountField';
import { Button } from '../components/Button';
import { Calendar, DayPicker } from '../components/Calendar';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Chip, FieldError, FieldLabel, Segmented, Switch } from '../components/controls';
import { MonthPicker } from '../components/MonthPicker';
import { Sheet } from '../components/Sheet';
import { CategoryEditor } from '../categories/CategoryEditor';
import { copy } from '../copy';
import { useCategories } from '../data';

export type FormMode =
  | { kind: 'new'; repeat: boolean }
  | { kind: 'edit'; tx: Transaction }
  | { kind: 'recurring'; recurring: Recurring };

interface FormState {
  type: TxType;
  amount: AmountInputState;
  categoryId: string | null;
  date: DateStr;
  description: string;
  note: string;
  repeat: boolean;
  dayOfMonth: number;
  /** Kullanıcı günü elle seçtiyse tarih değişince gün izlemez. */
  dayTouched: boolean;
  endPeriod: Period | null;
}

const EMPTY_AMOUNT: AmountInputState = { display: '', cursor: 0, kurus: null };

/** Not alanı 400 karakterden sonra sayaç gösterir. */
const NOTE_COUNTER_FROM = 400;

function initialState(mode: FormMode, today: DateStr): FormState {
  if (mode.kind === 'edit') {
    const t = mode.tx;
    return {
      type: t.type,
      amount: kurusToInput(t.amount),
      categoryId: t.categoryId,
      date: t.date,
      description: t.description,
      note: t.note,
      repeat: false,
      dayOfMonth: dayOfMonth(t.date),
      dayTouched: false,
      endPeriod: null,
    };
  }
  if (mode.kind === 'recurring') {
    const r = mode.recurring;
    return {
      type: r.type,
      amount: kurusToInput(r.amount),
      categoryId: r.categoryId,
      date: r.startDate,
      description: r.description,
      note: r.note,
      repeat: true,
      dayOfMonth: r.dayOfMonth,
      dayTouched: true,
      endPeriod: r.endPeriod ?? null,
    };
  }
  return {
    type: 'expense',
    amount: EMPTY_AMOUNT,
    categoryId: null,
    date: today,
    description: '',
    note: '',
    repeat: mode.repeat,
    dayOfMonth: dayOfMonth(today),
    dayTouched: false,
    endPeriod: null,
  };
}

/** Kaydedilmemiş değişiklik karşılaştırması için imleçsiz özet. */
function snapshot(s: FormState): string {
  const { amount, dayTouched: _d, ...rest } = s;
  return JSON.stringify({ ...rest, amount: amount.display });
}

interface Errors {
  amount?: string | undefined;
  category?: string | undefined;
  end?: string | undefined;
}

interface TransactionFormProps {
  mode: FormMode;
  onClose: () => void;
  /** Sabitten gelen kayıtta "Sabit işlemi düzenle →" */
  onOpenRecurring: (recurringId: string) => void;
}

export function TransactionForm({ mode, onClose, onOpenRecurring }: TransactionFormProps) {
  const today = useToday();
  const toast = useToast();
  const categories = useCategories();
  const formId = useId();
  const [initial] = useState(() => initialState(mode, today));
  const [s, setS] = useState<FormState>(initial);
  const [noteOpen, setNoteOpen] = useState(() => initial.note !== '');
  const [errors, setErrors] = useState<Errors>({});
  const [shake, setShake] = useState(0);
  const [overlay, setOverlay] = useState<
    null | 'calendar' | 'day' | 'end' | 'category' | 'unsaved' | 'deleteRecurring' | { switchTo: string }
  >(null);
  const [keptCount, setKeptCount] = useState(0);
  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const isRecurringMode = mode.kind === 'recurring';
  const linked = mode.kind === 'edit' && mode.tx.recurringId !== undefined ? mode.tx.recurringId : null;
  const showRepeatSwitch = !isRecurringMode && linked === null;
  const repeating = isRecurringMode || (showRepeatSwitch && s.repeat);
  const startDate = mode.kind === 'recurring' ? mode.recurring.startDate : s.date;
  const dirty = snapshot(s) !== snapshot(initial);

  const title = mode.kind === 'new' ? copy.form.newTitle : mode.kind === 'edit' ? copy.form.editTitle : copy.form.recurringTitle;

  const grid = useMemo(
    () => sortForGrid((categories ?? []).filter((c) => c.type === s.type)),
    [categories, s.type],
  );

  const update = (patch: Partial<FormState>) => setS((prev) => ({ ...prev, ...patch }));

  const setDate = (date: DateStr) =>
    setS((prev) => ({ ...prev, date, dayOfMonth: prev.dayTouched ? prev.dayOfMonth : dayOfMonth(date) }));

  const requestClose = () => {
    if (dirty) setOverlay('unsaved');
    else onClose();
  };

  const validate = (): Errors => {
    const next: Errors = {};
    const kurus = s.amount.kurus;
    if (kurus === null) next.amount = copy.errors.amountEmpty;
    else if (kurus === 0) next.amount = copy.errors.amountZero;
    else if (kurus > MAX_AMOUNT) next.amount = copy.errors.amountMax;
    if (s.categoryId === null || !grid.some((c) => c.id === s.categoryId)) next.category = copy.errors.category;
    if (repeating && s.endPeriod !== null && !isValidEndPeriod(startDate, s.endPeriod)) next.end = copy.errors.end;
    return next;
  };

  const save = async () => {
    const found = validate();
    setErrors(found);
    if (found.amount || found.category || found.end) {
      if (found.amount) {
        setShake((n) => n + 1);
        amountRef.current?.focus();
      } else if (found.category) {
        categoryRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      } else {
        endRef.current?.focus();
      }
      return;
    }
    const ctx = contextFrom();
    const input = {
      type: s.type,
      amount: s.amount.kurus as number,
      categoryId: s.categoryId as string,
      date: s.date,
      description: s.description,
      note: s.note,
    };
    const repeat = { dayOfMonth: s.dayOfMonth, ...(s.endPeriod !== null ? { endPeriod: s.endPeriod } : {}) };

    if (mode.kind === 'new') {
      const isFirst = (await db.transactions.count()) === 0;
      await addTransaction(db, input, ctx, s.repeat ? repeat : undefined);
      if (isFirst) void requestPersistentStorage();
      toast({ message: copy.toast.saved });
    } else if (mode.kind === 'edit') {
      await updateTransaction(db, mode.tx.id, input, ctx, showRepeatSwitch && s.repeat ? repeat : undefined);
      toast({ message: copy.toast.updated });
    } else {
      await updateRecurring(db, mode.recurring.id, { ...input, ...repeat }, ctx);
      toast({ message: copy.toast.updated });
    }
    onClose();
  };

  const deleteTx = async () => {
    if (mode.kind !== 'edit') return;
    const removed = await deleteTransaction(db, mode.tx.id);
    onClose();
    if (removed) {
      toast({
        message: copy.toast.deleted,
        action: { label: copy.toast.undo, onAction: () => void restoreTransaction(db, removed) },
      });
    }
  };

  const askDeleteRecurring = async () => {
    if (mode.kind !== 'recurring') return;
    setKeptCount(await countRecurringInstances(db, mode.recurring.id));
    setOverlay('deleteRecurring');
  };

  const deleteRec = async () => {
    if (mode.kind !== 'recurring') return;
    const removed = await deleteRecurring(db, mode.recurring.id);
    onClose();
    toast({
      message: copy.toast.recurringDeleted,
      action: { label: copy.toast.undo, onAction: () => void undoDeleteRecurring(db, removed) },
    });
  };

  const summary = repeatSummary(startDate, s.dayOfMonth, s.endPeriod ?? undefined);
  const recurringName =
    mode.kind === 'recurring'
      ? mode.recurring.description || categories?.find((c) => c.id === mode.recurring.categoryId)?.name || ''
      : '';
  const customDate = s.date !== today && s.date !== addDays(today, -1);

  return (
    <>
      <Sheet
        title={title}
        onRequestClose={requestClose}
        initialFocusRef={mode.kind === 'new' ? amountRef : undefined}
        footer={
          <Button type="submit" form={formId}>
            {copy.sheet.save}
          </Button>
        }
      >
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-6 pt-2 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Segmented<TxType>
            label={copy.type.label}
            value={s.type}
            options={[
              { value: 'expense', label: copy.type.expense, selectedClass: 'bg-expense-soft text-expense' },
              { value: 'income', label: copy.type.income, selectedClass: 'bg-income-soft text-income' },
            ]}
            onChange={(type) => {
              if (type === s.type) return;
              update({ type, categoryId: null });
            }}
          />

          <AmountField
            id={`${formId}-amount`}
            label={copy.form.amount}
            inputRef={amountRef}
            state={s.amount}
            shake={shake}
            error={errors.amount}
            onChange={(amount) => {
              update({ amount });
              if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
            }}
          />

          <div className="flex flex-col gap-2">
            <span id={`${formId}-cat`} className="text-[13px] leading-[18px] font-medium text-text-2">
              {copy.form.category}
            </span>
            <div ref={categoryRef} role="group" aria-labelledby={`${formId}-cat`} className="grid grid-cols-4 gap-x-1 gap-y-2">
              {grid.map((c) => {
                const selected = c.id === s.categoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selected}
                    className={`flex min-h-[84px] flex-col items-center gap-1.5 rounded-xl px-1 pt-2 pb-1.5 ${
                      selected ? 'bg-surface-2 shadow-[inset_0_0_0_2px_var(--accent)]' : ''
                    }`}
                    onClick={() => {
                      update({ categoryId: c.id });
                      if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
                    }}
                  >
                    <CategoryIcon icon={c.icon} color={c.color} />
                    <span className="line-clamp-2 text-center text-[13px] leading-4 font-medium break-words">{c.name}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="flex min-h-[84px] flex-col items-center gap-1.5 rounded-xl px-1 pt-2 pb-1.5"
                onClick={() => setOverlay('category')}
              >
                <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-text-2">
                  <Plus size={20} strokeWidth={1.75} />
                </span>
                <span className="text-[13px] leading-4 font-medium text-text-2">{copy.form.newCategory}</span>
              </button>
            </div>
            {errors.category && <FieldError id={`${formId}-cat-error`}>{errors.category}</FieldError>}
          </div>

          {!isRecurringMode && (
            <div className="flex flex-col gap-2">
              <span id={`${formId}-date`} className="text-[13px] leading-[18px] font-medium text-text-2">
                {copy.form.date}
              </span>
              <div role="group" aria-labelledby={`${formId}-date`} className="flex flex-wrap gap-2">
                <Chip pressed={s.date === today} onClick={() => setDate(today)}>
                  {copy.form.today}
                </Chip>
                <Chip pressed={s.date === addDays(today, -1)} onClick={() => setDate(addDays(today, -1))}>
                  {copy.form.yesterday}
                </Chip>
                <Chip pressed={customDate} asButton onClick={() => setOverlay('calendar')}>
                  <CalendarDays size={16} aria-hidden="true" />
                  {customDate ? shortDate(s.date) : copy.form.pickDate}
                </Chip>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <FieldLabel htmlFor={`${formId}-desc`}>{copy.form.description}</FieldLabel>
            <input
              id={`${formId}-desc`}
              type="text"
              maxLength={DESCRIPTION_MAX}
              value={s.description}
              placeholder={copy.form.descriptionPlaceholder}
              className="-mt-1 h-12 rounded-xl bg-surface-2 px-3.5 text-text outline-none placeholder:text-text-2 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
              onChange={(e) => update({ description: e.target.value.replace(/[\r\n]/g, ' ') })}
            />
            {noteOpen ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <FieldLabel htmlFor={`${formId}-note`}>{copy.form.note}</FieldLabel>
                  {s.note.length > NOTE_COUNTER_FROM && (
                    <span className="text-[13px] leading-[18px] font-medium text-text-2 tabular-nums" aria-live="polite">
                      {s.note.length}/{NOTE_MAX}
                    </span>
                  )}
                </div>
                <textarea
                  ref={noteRef}
                  id={`${formId}-note`}
                  rows={3}
                  maxLength={NOTE_MAX}
                  value={s.note}
                  className="field-sizing-content min-h-[88px] resize-none rounded-xl bg-surface-2 px-3.5 py-3 text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
                  onChange={(e) => update({ note: e.target.value })}
                />
              </div>
            ) : (
              <button
                type="button"
                className="hit-area self-start py-1 text-[15px] font-semibold text-accent"
                onClick={() => {
                  setNoteOpen(true);
                  requestAnimationFrame(() => noteRef.current?.focus());
                }}
              >
                {copy.form.addNote}
              </button>
            )}
          </div>

          {(showRepeatSwitch || isRecurringMode) && (
            <div className="flex flex-col gap-4 rounded-2xl bg-surface-2 p-4">
              {showRepeatSwitch && (
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium">{copy.form.repeat}</span>
                    <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.form.repeatHint}</span>
                  </div>
                  <Switch checked={s.repeat} label={copy.form.repeat} onChange={(repeat) => update({ repeat })} />
                </div>
              )}
              {repeating && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{copy.form.dayOfMonth}</span>
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      className="flex h-10 items-center gap-1 rounded-xl bg-surface px-3 font-semibold tabular-nums"
                      onClick={() => setOverlay('day')}
                    >
                      {s.dayOfMonth}
                      <ChevronDown size={16} aria-hidden="true" />
                    </button>
                  </div>
                  {s.dayOfMonth >= 29 && (
                    <span className="-mt-2 text-[13px] leading-[18px] font-medium text-text-2">{copy.form.shortMonthNote}</span>
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{copy.form.end}</span>
                      <button
                        ref={endRef}
                        type="button"
                        aria-haspopup="dialog"
                        aria-invalid={errors.end ? true : undefined}
                        className={`flex h-10 items-center gap-1 rounded-xl bg-surface px-3 font-semibold ${
                          errors.end ? 'shadow-[inset_0_0_0_2px_var(--expense)]' : ''
                        }`}
                        onClick={() => setOverlay('end')}
                      >
                        {s.endPeriod ? monthLabel(s.endPeriod) : copy.form.noEnd}
                        <ChevronDown size={16} aria-hidden="true" />
                      </button>
                    </div>
                    {errors.end && <FieldError id={`${formId}-end-error`}>{errors.end}</FieldError>}
                  </div>
                  <span className="flex items-center gap-2 text-[13px] leading-[18px] font-medium text-text-2">
                    <Repeat size={14} aria-hidden="true" />
                    {mode.kind === 'recurring'
                      ? copy.recurring.next(dayMonth(occurrenceDate({ dayOfMonth: s.dayOfMonth }, addMonths(mode.recurring.lastGeneratedPeriod, 1))))
                      : copy.form.firstRepeat(dayMonth(summary.firstRepeat))}
                    {summary.lastPeriod && ` · ${copy.form.lastRepeat(monthLabel(summary.lastPeriod))}`}
                  </span>
                </>
              )}
            </div>
          )}

          {isRecurringMode && <p className="m-0 text-[13px] leading-[18px] font-medium text-text-2">{copy.form.recurringNote}</p>}

          {linked !== null && (
            <div className="flex gap-3 rounded-2xl bg-surface-2 p-4">
              <Repeat size={18} className="mt-0.5 shrink-0 text-text-2" aria-hidden="true" />
              <span className="flex flex-col gap-1">
                <span className="font-medium">{copy.form.linkedTitle}</span>
                <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.form.linkedHint}</span>
                <button
                  type="button"
                  className="hit-area self-start py-1 text-[13px] leading-[18px] font-semibold text-accent"
                  onClick={() => (dirty ? setOverlay({ switchTo: linked }) : onOpenRecurring(linked))}
                >
                  {copy.form.editRecurring}
                </button>
              </span>
            </div>
          )}

          {mode.kind === 'edit' && (
            <button type="button" className="self-center py-2 font-semibold text-expense" onClick={() => void deleteTx()}>
              {copy.form.deleteTx}
            </button>
          )}
          {mode.kind === 'recurring' && (
            <button type="button" className="self-center py-2 font-semibold text-expense" onClick={() => void askDeleteRecurring()}>
              {copy.form.deleteRecurring}
            </button>
          )}
        </form>
      </Sheet>

      {overlay === 'calendar' && (
        <Calendar
          value={s.date}
          today={today}
          onClose={() => setOverlay(null)}
          onSelect={(date) => {
            setDate(date);
            setOverlay(null);
          }}
        />
      )}
      {overlay === 'day' && (
        <DayPicker
          value={s.dayOfMonth}
          onClose={() => setOverlay(null)}
          onSelect={(day) => {
            update({ dayOfMonth: day, dayTouched: true });
            setOverlay(null);
          }}
        />
      )}
      {overlay === 'end' && (
        <MonthPicker
          title={copy.form.end}
          value={s.endPeriod ?? firstRepeatPeriod(startDate)}
          min={firstRepeatPeriod(startDate)}
          onClose={() => setOverlay(null)}
          onSelect={(endPeriod) => {
            update({ endPeriod });
            setErrors((e) => ({ ...e, end: undefined }));
            setOverlay(null);
          }}
          extra={
            <Chip
              pressed={s.endPeriod === null}
              className="self-start"
              onClick={() => {
                update({ endPeriod: null });
                setErrors((e) => ({ ...e, end: undefined }));
                setOverlay(null);
              }}
            >
              {copy.form.noEnd}
            </Chip>
          }
        />
      )}
      {overlay === 'category' && (
        <CategoryEditor
          type={s.type}
          onClose={() => setOverlay(null)}
          onSaved={(id) => {
            update({ categoryId: id });
            setErrors((e) => ({ ...e, category: undefined }));
            setOverlay(null);
          }}
        />
      )}
      {(overlay === 'unsaved' || (typeof overlay === 'object' && overlay !== null)) && (
        <ConfirmDialog
          title={copy.form.unsavedTitle}
          message={copy.form.unsavedBody}
          confirmLabel={copy.form.unsavedExit}
          cancelLabel={copy.form.unsavedBack}
          onCancel={() => setOverlay(null)}
          onConfirm={() => {
            const target = typeof overlay === 'object' && overlay !== null ? overlay.switchTo : null;
            setOverlay(null);
            if (target) onOpenRecurring(target);
            else onClose();
          }}
        />
      )}
      {overlay === 'deleteRecurring' && (
        <ConfirmDialog
          title={copy.recurring.deleteTitle(recurringName)}
          message={copy.recurring.deleteBody(keptCount)}
          confirmLabel={copy.recurring.deleteConfirm}
          cancelLabel={copy.sheet.cancel}
          onCancel={() => setOverlay(null)}
          onConfirm={() => void deleteRec()}
        />
      )}
    </>
  );
}

