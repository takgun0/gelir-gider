// Onay diyaloğu (DESIGN §6, bileşen kartı): ortada kart, butonlar alt alta.
// Yıkıcı eylemde birincil buton expense renginde; açılınca odak Vazgeç'tedir.
import { useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { ModalLayer } from './ModalLayer';

interface ConfirmDialogProps {
  title: string;
  message?: ReactNode;
  /** Ör. "1 / 2" */
  step?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'danger' | 'primary';
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Ek içerik (ör. "SİL yaz" alanı) */
  children?: ReactNode;
}

export function ConfirmDialog({
  title,
  message,
  step,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <ModalLayer
      role="alertdialog"
      labelledBy={titleId}
      describedBy={message ? messageId : undefined}
      onRequestClose={onCancel}
      initialFocusRef={cancelRef}
      className="flex items-center justify-center p-6"
      panelClassName="dialog-panel flex w-full max-w-[342px] flex-col gap-5 rounded-[20px] bg-surface p-6 shadow-[0_16px_40px_var(--shadow)]"
    >
      <div className="flex flex-col gap-2">
        {step && <span className="text-[13px] leading-[18px] font-medium text-text-2">{step}</span>}
        <h2 id={titleId} className="text-[17px] leading-[22px] font-semibold">
          {title}
        </h2>
        {message && (
          <p id={messageId} className="m-0 text-text-2">
            {message}
          </p>
        )}
      </div>
      {children}
      <div className="flex flex-col gap-2">
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} disabled={confirmDisabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </ModalLayer>
  );
}
