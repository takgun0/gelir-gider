import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: { label: string; onClick: () => void } | undefined;
}

/** Boş durum (Tasarım §8): ikon, tek cümle, tek eylem. */
export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface px-6 py-10 text-center">
      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-surface-2 text-text-2">
        <Icon size={24} strokeWidth={1.75} />
      </span>
      <p className="m-0 max-w-[280px] text-text-2">{message}</p>
      {action && (
        <button type="button" className="h-11 rounded-xl bg-accent px-5 font-semibold text-on-accent active:brightness-90" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
