// Borç / alacak ekle ve düzenle (Tasarım §6.8). İşlem formuyla aynı alan düzeni:
// tür, tutar, kişi, tarih, vade, açıklama, not.
import { CalendarClock } from 'lucide-react';
import { CalendarDays } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { kurusToInput, type AmountInputState } from '../../domain/amount-input';
import { addDays, shortDate } from '../../domain/date';
import { PERSON_MAX } from '../../domain/debts';
import { MAX_AMOUNT } from '../../domain/money';
import { compareTr } from '../../domain/text';
import type { DateStr, Debt, DebtDirection } from '../../domain/types';
import { contextFrom } from '../../db/context';
import { db } from '../../db/db';
import { addDebt, deleteDebt, restoreDebt, setDebtPaid, updateDebt } from '../../db/ops/debts';
import { DESCRIPTION_MAX, NOTE_MAX } from '../../db/ops/validate';
import { useToday } from '../../app/today';
import { useToast } from '../../app/toast';
import { AmountField } from '../components/AmountField';
import { Button } from '../components/Button';
import { Calendar } from '../components/Calendar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Chip, FieldError, FieldLabel, Segmented } from '../components/controls';
import { Sheet } from '../components/Sheet';
import { copy } from '../copy';
import { useDebts } from '../data';

interface FormState {
  direction: DebtDirection;
  amount: AmountInputState;
  person: string;
  date: DateStr;
  dueDate: DateStr | null;
  description: string;
  note: string;
}

interface Errors {
  amount?: string | undefined;
  person?: string | undefined;
  due?: string | undefined;
}

const NOTE_COUNTER_FROM = 400;

function initialState(debt: Debt | undefined, today: DateStr): FormState {
  if (debt) {
    return {
      direction: debt.direction,
      amount: kurusToInput(debt.amount),
      person: debt.person,
      date: debt.date,
      dueDate: debt.dueDate ?? null,
      description: debt.description,
      note: debt.note,
    };
  }
  return {
    direction: 'payable',
    amount: { display: '', cursor: 0, kurus: null },
    person: '',
    date: today,
    dueDate: null,
    description: '',
    note: '',
  };
}

function snapshot(s: FormState): string {
  const { amount, ...rest } = s;
  return JSON.stringify({ ...rest, amount: amount.display });
}

export function DebtForm({ debt, onClose }: { debt?: Debt | undefined; onClose: () => void }) {
  const today = useToday();
  const toast = useToast();
  const debts = useDebts();
  const formId = useId();
  const [initial] = useState(() => initialState(debt, today));
  const [s, setS] = useState(initial);
  const [noteOpen, setNoteOpen] = useState(initial.note !== '');
  const [errors, setErrors] = useState<Errors>({});
  const [shake, setShake] = useState(0);
  const [overlay, setOverlay] = useState<null | 'date' | 'due' | 'unsaved'>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const personRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const dirty = snapshot(s) !== snapshot(initial);

  // Daha önce yazılan kişi adları öneri olarak gelir.
  const people = useMemo(
    () => [...new Set((debts ?? []).map((d) => d.person))].sort(compareTr),
    [debts],
  );

  const update = (patch: Partial<FormState>) => setS((prev) => ({ ...prev, ...patch }));
  const customDate = s.date !== today && s.date !== addDays(today, -1);

  const requestClose = () => (dirty ? setOverlay('unsaved') : onClose());

  const save = async () => {
    const found: Errors = {};
    const kurus = s.amount.kurus;
    if (kurus === null) found.amount = copy.errors.amountEmpty;
    else if (kurus === 0) found.amount = copy.errors.amountZero;
    else if (kurus > MAX_AMOUNT) found.amount = copy.errors.amountMax;
    if (s.person.trim() === '') found.person = copy.debts.personError;
    if (s.dueDate !== null && s.dueDate < s.date) found.due = copy.debts.dueError;
    setErrors(found);
    if (found.amount) {
      setShake((n) => n + 1);
      amountRef.current?.focus();
      return;
    }
    if (found.person) return personRef.current?.focus();
    if (found.due) return document.getElementById(`${formId}-due-btn`)?.focus();

    const input = {
      direction: s.direction,
      amount: kurus as number,
      person: s.person,
      date: s.date,
      dueDate: s.dueDate ?? undefined,
      description: s.description,
      note: s.note,
    };
    if (debt) {
      await updateDebt(db, debt.id, input, contextFrom());
      toast({ message: copy.toast.updated });
    } else {
      await addDebt(db, input, contextFrom());
      toast({ message: copy.debts.addedToast });
    }
    onClose();
  };

  const togglePaid = async () => {
    if (!debt) return;
    const before = await setDebtPaid(db, debt.id, debt.paidOn === undefined ? today : null, contextFrom());
    onClose();
    toast({
      message: debt.paidOn === undefined ? copy.debts.paidToast : copy.debts.reopenedToast,
      action: { label: copy.toast.undo, onAction: () => void restoreDebt(db, before) },
    });
  };

  const remove = async () => {
    if (!debt) return;
    const removed = await deleteDebt(db, debt.id);
    onClose();
    if (removed) {
      toast({ message: copy.debts.deletedToast, action: { label: copy.toast.undo, onAction: () => void restoreDebt(db, removed) } });
    }
  };

  return (
    <>
      <Sheet
        title={debt ? copy.debts.editTitle : copy.debts.newTitle}
        onRequestClose={requestClose}
        initialFocusRef={debt ? undefined : amountRef}
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
          <div className="flex flex-col gap-2">
            <Segmented<DebtDirection>
              label={copy.debts.type}
              value={s.direction}
              options={[
                { value: 'payable', label: copy.debts.payable, selectedClass: 'bg-expense-soft text-expense' },
                { value: 'receivable', label: copy.debts.receivable, selectedClass: 'bg-income-soft text-income' },
              ]}
              onChange={(direction) => update({ direction })}
            />
            <span className="text-center text-[13px] leading-[18px] font-medium text-text-2">
              {s.direction === 'payable' ? copy.debts.payableHint : copy.debts.receivableHint}
            </span>
          </div>

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
            <FieldLabel htmlFor={`${formId}-person`}>{copy.debts.person}</FieldLabel>
            <input
              ref={personRef}
              id={`${formId}-person`}
              type="text"
              list={`${formId}-people`}
              autoComplete="off"
              maxLength={PERSON_MAX}
              value={s.person}
              placeholder={copy.debts.personPlaceholder}
              aria-invalid={errors.person ? true : undefined}
              aria-describedby={errors.person ? `${formId}-person-error` : undefined}
              className={`h-12 rounded-xl bg-surface-2 px-3.5 text-text outline-none placeholder:text-text-2 focus-visible:outline-2 focus-visible:outline-offset-0 ${
                errors.person ? 'outline-2 outline-expense' : 'focus-visible:outline-accent'
              }`}
              onChange={(e) => {
                update({ person: e.target.value.replace(/[\r\n]/g, ' ') });
                if (errors.person) setErrors((x) => ({ ...x, person: undefined }));
              }}
            />
            <datalist id={`${formId}-people`}>
              {people.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            {errors.person && <FieldError id={`${formId}-person-error`}>{errors.person}</FieldError>}
          </div>

          <div className="flex flex-col gap-2">
            <span id={`${formId}-date`} className="text-[13px] leading-[18px] font-medium text-text-2">
              {copy.debts.date}
            </span>
            <div role="group" aria-labelledby={`${formId}-date`} className="flex flex-wrap gap-2">
              <Chip pressed={s.date === today} onClick={() => update({ date: today })}>
                {copy.form.today}
              </Chip>
              <Chip pressed={s.date === addDays(today, -1)} onClick={() => update({ date: addDays(today, -1) })}>
                {copy.form.yesterday}
              </Chip>
              <Chip pressed={customDate} asButton onClick={() => setOverlay('date')}>
                <CalendarDays size={16} aria-hidden="true" />
                {customDate ? shortDate(s.date) : copy.form.pickDate}
              </Chip>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span id={`${formId}-due`} className="text-[13px] leading-[18px] font-medium text-text-2">
              {copy.debts.dueDate}
            </span>
            <div role="group" aria-labelledby={`${formId}-due`} className="flex flex-wrap gap-2">
              <Chip
                pressed={s.dueDate === null}
                onClick={() => {
                  update({ dueDate: null });
                  setErrors((e) => ({ ...e, due: undefined }));
                }}
              >
                {copy.debts.noDue}
              </Chip>
              <Chip id={`${formId}-due-btn`} pressed={s.dueDate !== null} asButton onClick={() => setOverlay('due')}>
                <CalendarClock size={16} aria-hidden="true" />
                {s.dueDate !== null ? shortDate(s.dueDate) : copy.debts.pickDue}
              </Chip>
            </div>
            {errors.due && <FieldError id={`${formId}-due-error`}>{errors.due}</FieldError>}
          </div>

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

          {debt && (
            <div className="flex flex-col items-center gap-1">
              {debt.paidOn !== undefined && (
                <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.debts.paidOn(shortDate(debt.paidOn))}</span>
              )}
              <button type="button" className="py-2 font-semibold text-accent" onClick={() => void togglePaid()}>
                {debt.paidOn === undefined ? copy.debts.markPaid : copy.debts.markUnpaid}
              </button>
              <button type="button" className="py-2 font-semibold text-expense" onClick={() => void remove()}>
                {copy.debts.delete}
              </button>
            </div>
          )}
        </form>
      </Sheet>

      {overlay === 'date' && (
        <Calendar
          value={s.date}
          today={today}
          onClose={() => setOverlay(null)}
          onSelect={(date) => {
            update({ date });
            setOverlay(null);
          }}
        />
      )}
      {overlay === 'due' && (
        <Calendar
          title={copy.debts.dueDate}
          value={s.dueDate ?? today}
          today={today}
          max={null}
          min={s.date}
          onClose={() => setOverlay(null)}
          onSelect={(dueDate) => {
            update({ dueDate });
            setErrors((e) => ({ ...e, due: undefined }));
            setOverlay(null);
          }}
        />
      )}
      {overlay === 'unsaved' && (
        <ConfirmDialog
          title={copy.form.unsavedTitle}
          message={copy.form.unsavedBody}
          confirmLabel={copy.form.unsavedExit}
          cancelLabel={copy.form.unsavedBack}
          onCancel={() => setOverlay(null)}
          onConfirm={() => {
            setOverlay(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
