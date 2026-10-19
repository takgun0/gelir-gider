// Bildirimler (Gereksinimler §6, Tasarım §8): aynı anda tek bildirim, yenisi eskisinin yerini
// alır ve eskisinin "Geri al" fırsatı biter. 3 sn; "Geri al" içerenlerde 6 sn.
import { CircleAlert } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export interface ToastInput {
  message: string;
  action?: { label: string; onAction: () => void };
  /** Hata bildirimi ikonla gösterilir (ör. geçersiz yedek dosyası). */
  tone?: 'error';
  /** Kendiliğinden kapanmaz (ör. "Yeni sürüm hazır · Yenile"); yeni bildirim yerini alır. */
  persistent?: boolean;
}

interface ActiveToast extends ToastInput {
  id: number;
}

export const TOAST_MS = 3000;
export const TOAST_ACTION_MS = 6000;

const ToastContext = createContext<(toast: ToastInput) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const nextId = useRef(1);

  const show = useCallback((input: ToastInput) => {
    setToast({ ...input, id: nextId.current++ });
  }, []);

  useEffect(() => {
    if (!toast || toast.persistent) return;
    const timer = window.setTimeout(() => setToast(null), toast.action ? TOAST_ACTION_MS : TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext value={show}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-4 z-40 flex justify-center bottom-[calc(76px+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end"
      >
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex min-h-[52px] w-full max-w-[420px] items-center gap-2 rounded-xl bg-toast py-1 pr-1 pl-4 font-medium text-on-toast shadow-[0_8px_24px_var(--shadow)] sm:w-[360px]"
          >
            {toast.tone === 'error' && <CircleAlert size={20} className="shrink-0 text-expense" aria-hidden="true" />}
            <span className="flex-1 py-2">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="h-11 rounded-[10px] px-3.5 font-semibold text-toast-accent"
                onClick={() => {
                  toast.action?.onAction();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext>
  );
}

export function useToast(): (toast: ToastInput) => void {
  return useContext(ToastContext);
}
