// Alt sayfa, modal ve onay diyaloğunun ortak altyapısı (SPEC §6): portal, odak hapsi,
// Esc ile kapanma, aria-modal, arka planı inert yapma ve kapanınca odağı açan öğeye
// geri verme. Üst üste açılan katmanlarda yalnızca en üstteki etkindir.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { modalStack } from './modal-stack';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.closest('[inert]'));
}

interface ModalLayerProps {
  role: 'dialog' | 'alertdialog';
  labelledBy: string;
  describedBy?: string | undefined;
  /** Esc ya da arka plana dokunma: kapatma isteği (kaydedilmemiş değişiklik onayı çağıranda). */
  onRequestClose: () => void;
  /** Açılınca odaklanacak öğe; yoksa ilk odaklanabilir öğe. */
  initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  closeOnScrim?: boolean;
  /** Katmanın yerleşimi (paneli konumlandıran kap). */
  className: string;
  panelClassName: string;
  panelRef?: RefObject<HTMLDivElement | null> | undefined;
  panelStyle?: CSSProperties | undefined;
  scrimStyle?: CSSProperties | undefined;
  children: ReactNode;
}

export function ModalLayer({
  role,
  labelledBy,
  describedBy,
  onRequestClose,
  initialFocusRef,
  closeOnScrim = true,
  className,
  panelClassName,
  panelRef,
  panelStyle,
  scrimStyle,
  children,
}: ModalLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onRequestClose);
  useEffect(() => {
    closeRef.current = onRequestClose;
  });

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const madeInert: HTMLElement[] = [];
    for (const el of document.body.children) {
      if (el instanceof HTMLElement && el !== layer && !el.inert) {
        el.inert = true;
        madeInert.push(el);
      }
    }
    modalStack.push(layer);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const target = initialFocusRef?.current ?? focusables(layer)[0] ?? layer;
    target.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== layer) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables(layer);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !layer.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !layer.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      modalStack.splice(modalStack.indexOf(layer), 1);
      for (const el of madeInert) el.inert = false;
      if (modalStack.length === 0) document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    // Yalnızca açılışta kurulur; kapanış isteği ref üzerinden güncel tutulur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div ref={layerRef} className={`fixed inset-0 z-50 ${className}`} tabIndex={-1}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-scrim"
        style={scrimStyle}
        onClick={closeOnScrim ? () => closeRef.current() : undefined}
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`relative ${panelClassName}`}
        style={panelStyle}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
