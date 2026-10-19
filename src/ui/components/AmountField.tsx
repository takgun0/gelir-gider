// Tutar alanı (SPEC §5.1 "Form girişi", DESIGN §6.3). Yazma kuralları saf fonksiyonlarda
// (domain/amount-input); burada yalnızca olaylar bağlanır. beforeinput iptal edilemezse
// (bazı Android klavyeleri) input olayında önceki ve yeni değer karşılaştırılır.
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import {
  applyRawChange,
  deleteBackward,
  deleteForward,
  insertText,
  pasteAmount,
  type AmountInputState,
} from '../../domain/amount-input';
import { FieldError } from './controls';

interface AmountFieldProps {
  id: string;
  label: string;
  state: AmountInputState;
  onChange: (state: AmountInputState) => void;
  error?: string | undefined;
  /** Her hatalı kaydetmede artar; sallanmayı yeniden başlatır. */
  shake: number;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function AmountField({ id, label, state, onChange, error, shake, inputRef }: AmountFieldProps) {
  const stateRef = useRef(state);
  const pendingCursor = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    stateRef.current = state;
    onChangeRef.current = onChange;
  });

  const commit = (next: AmountInputState) => {
    pendingCursor.current = next.cursor;
    stateRef.current = next;
    onChangeRef.current(next);
  };

  // İmleç, biçimlendirmeden sonra aynı rakamın yanında kalır.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (el && pendingCursor.current !== null && document.activeElement === el) {
      el.setSelectionRange(pendingCursor.current, pendingCursor.current);
    }
    pendingCursor.current = null;
  });

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onBeforeInput = (event: InputEvent) => {
      if (!event.cancelable) return;
      const display = stateRef.current.display;
      const start = el.selectionStart ?? display.length;
      const end = el.selectionEnd ?? start;
      switch (event.inputType) {
        case 'insertText':
        case 'insertReplacementText': {
          const data = event.data ?? event.dataTransfer?.getData('text/plain') ?? '';
          event.preventDefault();
          commit(insertText(display, start, end, data));
          break;
        }
        case 'deleteContentBackward':
          event.preventDefault();
          commit(deleteBackward(display, start, end));
          break;
        case 'deleteContentForward':
          event.preventDefault();
          commit(deleteForward(display, start, end));
          break;
        case 'insertFromDrop':
          event.preventDefault();
          break;
        default:
        // Diğerleri (kompozisyon, kelime silme) input olayındaki yedek yoldan geçer.
      }
    };
    el.addEventListener('beforeinput', onBeforeInput);
    return () => el.removeEventListener('beforeinput', onBeforeInput);
  }, [inputRef]);

  const errorId = `${id}-error`;
  return (
    <div className="group flex flex-col items-center gap-0.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        key={shake}
        className={`flex items-baseline gap-1 font-semibold tabular-nums ${error && shake > 0 ? 'shake' : ''}`}
      >
        <span aria-hidden="true" className="text-[28px] leading-[44px] text-text-2">
          ₺
        </span>
        <input
          ref={inputRef}
          id={id}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="0"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={state.display}
          style={{ width: `${Math.max(state.display.length, 1) + 0.6}ch` }}
          className="min-w-[1.6ch] bg-transparent p-0 text-center text-[40px] leading-[44px] font-semibold text-text tabular-nums outline-none placeholder:text-text-2"
          onChange={(e) => commit(applyRawChange(stateRef.current.display, e.target.value))}
          onPaste={(e) => {
            e.preventDefault();
            const el = e.currentTarget;
            const display = stateRef.current.display;
            const next = pasteAmount(display, el.selectionStart ?? display.length, el.selectionEnd ?? display.length, e.clipboardData.getData('text/plain'));
            if (next) commit(next);
          }}
        />
      </div>
      <span
        aria-hidden="true"
        className={`h-0.5 w-40 ${error ? 'bg-expense' : 'bg-border group-focus-within:bg-accent'}`}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
