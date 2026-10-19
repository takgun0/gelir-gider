// Tanıtım (Tasarım §6.7): birkaç adımda işlem ekleme, not ve tekrar, kategoriler ve
// yedeğin önemi. Mobilde alttan açılan sayfa, 640 px ve üstünde ortada kart.
// ← → ile adımlar arasında gezilir, Esc ve "Geç" kapatır.
import type { LucideIcon } from 'lucide-react';
import { NotebookPen } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Shapes } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { SquarePlus } from 'lucide-react';
import { Wallet } from 'lucide-react';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { isStandalone } from '../../app/download';
import { Button } from '../components/Button';
import { ModalLayer } from '../components/ModalLayer';
import { copy } from '../copy';
import { detectPlatform, tourSteps, type TourStep } from './steps';

const ICONS: Record<TourStep['key'], LucideIcon> = {
  welcome: Wallet,
  install: SquarePlus,
  add: Plus,
  note: NotebookPen,
  categories: Shapes,
  backup: ShieldCheck,
};

export function Tour({ onClose }: { onClose: () => void }) {
  const steps = useMemo(
    () => tourSteps({ standalone: isStandalone(), platform: detectPlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints) }),
    [],
  );
  const [step, setStep] = useState(0);
  const titleId = useId();
  const bodyId = useId();
  const nextRef = useRef<HTMLButtonElement>(null);
  const last = step === steps.length - 1;
  const current = steps[step] ?? (steps[0] as TourStep);
  const Icon = ICONS[current.key];
  // Yedek adımı uyarı tonunda gösterilir.
  const warning = current.key === 'backup';

  const go = (to: number) => {
    setStep(Math.max(0, Math.min(steps.length - 1, to)));
    nextRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(step + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(step - 1);
    }
  };

  return (
    <ModalLayer
      role="dialog"
      labelledBy={titleId}
      describedBy={bodyId}
      onRequestClose={onClose}
      closeOnScrim={false}
      initialFocusRef={nextRef}
      className="flex items-end justify-center sm:items-center sm:p-6"
      panelClassName="sheet-panel flex max-h-dvh w-full flex-col overflow-y-auto rounded-t-[20px] bg-surface px-6 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_var(--shadow)] sm:max-w-[420px] sm:rounded-[20px] sm:pt-6 sm:pb-6 sm:shadow-[0_16px_40px_var(--shadow)]"
    >
      <div className="flex flex-col" onKeyDown={onKeyDown}>
        <div className="flex h-11 items-center justify-between">
          <span className="text-[13px] leading-[18px] font-medium text-text-2 tabular-nums" aria-live="polite">
            <span className="sr-only">{copy.tour.label} </span>
            {copy.tour.stepOf(step + 1, steps.length)}
          </span>
          {!last && (
            <button type="button" className="-mr-2 h-11 rounded-xl px-2 font-medium text-accent" onClick={onClose}>
              {copy.tour.skip}
            </button>
          )}
        </div>

        <div className="flex min-h-[248px] flex-col items-center gap-5 pt-4 pb-6 text-center">
          <span
            aria-hidden="true"
            className={`flex size-20 items-center justify-center rounded-full ${
              warning ? 'bg-expense-soft text-expense' : 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent'
            }`}
          >
            <Icon size={36} strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-2">
            <h2 id={titleId} className="m-0 text-[22px] leading-7 font-semibold">
              {current.title}
            </h2>
            <p id={bodyId} className="m-0 text-text-2">
              {current.body}
            </p>
          </div>
          {current.list && (
            <ol className="m-0 flex w-full list-none flex-col gap-2 rounded-2xl bg-surface-2 p-4 text-left">
              {current.list.map((item, i) => (
                <li key={item} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs leading-4 font-semibold text-on-accent"
                  >
                    {i + 1}
                  </span>
                  <span className="pt-px">{item}</span>
                </li>
              ))}
            </ol>
          )}
          {current.note && <p className="m-0 text-[13px] leading-[18px] font-medium text-text-2">{current.note}</p>}
        </div>

        <div aria-hidden="true" className="flex justify-center gap-1.5 pb-6">
          {steps.map((s, i) => (
            <span key={s.key} className={`h-1.5 rounded-full transition-[width] ${i === step ? 'w-5 bg-accent' : 'w-1.5 bg-border'}`} />
          ))}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="secondary" className="h-[52px] flex-1" onClick={() => go(step - 1)}>
              {copy.tour.back}
            </Button>
          )}
          <Button ref={nextRef} className="flex-[2]" onClick={() => (last ? onClose() : go(step + 1))}>
            {last ? copy.tour.start : copy.tour.next}
          </Button>
        </div>
      </div>
    </ModalLayer>
  );
}
