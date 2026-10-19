// Mobilde alttan açılan sayfa, 640 px ve üstünde modal (DESIGN §6.3, bileşen kartı).
// Üst köşeler 20 px, tutamaç, aşağı çekince kapanır; Kaydet altta sabit.
import { useId, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { useIsMobile, useKeyboardInset } from '../../app/viewport';
import { copy } from '../copy';
import { ModalLayer } from './ModalLayer';

/** Aşağı çekme bu mesafeyi geçince kapatma istenir. */
const DRAG_CLOSE_PX = 96;

interface SheetProps {
  title: string;
  /** Vazgeç, Esc, arka plan ve aşağı çekme; kaydedilmemiş değişiklik onayı çağıranda. */
  onRequestClose: () => void;
  /** Altta sabit alan (ör. Kaydet butonu). */
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  /** Masaüstü genişliği (px) */
  width?: number;
  children: ReactNode;
}

export function Sheet({ title, onRequestClose, footer, initialFocusRef, width = 480, children }: SheetProps) {
  const titleId = useId();
  const isMobile = useIsMobile();
  const keyboard = useKeyboardInset();
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; pointerId: number } | null>(null);
  const [dragY, setDragY] = useState(0);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isMobile || (event.target as HTMLElement).closest('button')) return;
    drag.current = { startY: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    setDragY(Math.max(0, event.clientY - drag.current.startY));
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    const shouldClose = dragY > DRAG_CLOSE_PX;
    setDragY(0);
    if (shouldClose) onRequestClose();
  };

  return (
    <ModalLayer
      role="dialog"
      labelledBy={titleId}
      onRequestClose={onRequestClose}
      initialFocusRef={initialFocusRef}
      className="flex items-end justify-center sm:items-center sm:p-6"
      panelRef={panelRef}
      panelClassName="sheet-panel flex w-full flex-col rounded-t-[20px] bg-surface shadow-[0_-8px_24px_var(--shadow)] sm:rounded-[20px] sm:shadow-[0_16px_40px_var(--shadow)]"
      panelStyle={{
        maxWidth: isMobile ? undefined : width,
        maxHeight: isMobile
          ? `calc(100dvh - ${keyboard}px - env(safe-area-inset-top) - 12px)`
          : 'min(880px, calc(100dvh - 48px))',
        marginBottom: isMobile ? keyboard : undefined,
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: dragY ? 'none' : undefined,
      }}
    >
      <div
        className="shrink-0 touch-none px-4 pt-2 sm:pt-3"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div aria-hidden="true" className="mx-auto h-[5px] w-9 rounded-full bg-border sm:hidden" />
        <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center">
          <button
            type="button"
            className="-ml-2 h-11 justify-self-start rounded-xl px-2 font-medium text-accent"
            onClick={onRequestClose}
          >
            {copy.sheet.cancel}
          </button>
          <h2 id={titleId} className="text-[17px] leading-[22px] font-semibold">
            {title}
          </h2>
          <span />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4">{children}</div>
      {footer && (
        <div className={`shrink-0 px-4 pt-2 ${keyboard ? 'pb-3' : 'pb-[max(16px,env(safe-area-inset-bottom))]'}`}>{footer}</div>
      )}
    </ModalLayer>
  );
}
