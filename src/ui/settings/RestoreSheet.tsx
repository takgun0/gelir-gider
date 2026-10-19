// Geri yükleme onayı (Tasarım §6.6): önizleme, karşılaştırma, uyarı ve onay kutusu.
// Mobilde tam sayfa, masaüstünde modal.
import { ArrowRight } from 'lucide-react';
import { FileJson } from 'lucide-react';
import { TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import type { RestorePreview } from '../../domain/backup';
import { fullDate, monthLabel } from '../../domain/date';
import { Button } from '../components/Button';
import { Sheet } from '../components/Sheet';
import { copy } from '../copy';

interface RestoreSheetProps {
  fileName: string;
  preview: RestorePreview;
  currentCount: number;
  onCancel: () => void;
  onConfirm: (backupFirst: boolean) => void;
  busy: boolean;
}

export function RestoreSheet({ fileName, preview, currentCount, onCancel, onConfirm, busy }: RestoreSheetProps) {
  const [backupFirst, setBackupFirst] = useState(true);
  const checkboxId = useId();
  const { counts, range } = preview;

  return (
    <Sheet
      title={copy.restore.title}
      onRequestClose={onCancel}
      fullScreen
      footer={
        <div className="flex flex-col gap-2">
          <Button variant="danger" className="h-[52px] text-base" disabled={busy} onClick={() => onConfirm(backupFirst)}>
            {copy.restore.confirm}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {copy.sheet.cancel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-2 pb-2">
        <section className="flex flex-col gap-4 rounded-2xl bg-surface-2 p-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-text">
              <FileJson size={20} strokeWidth={1.75} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{fileName}</span>
              <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.restore.backupDate(fullDate(preview.exportedDate))}</span>
            </span>
          </div>
          <dl className="m-0 grid grid-cols-3 gap-2">
            {(
              [
                [copy.restore.transactions, counts.transactions],
                [copy.restore.categories, counts.categories],
                [copy.restore.recurrings, counts.recurrings],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 rounded-xl bg-surface p-3">
                <dt className="text-xs leading-4 font-medium text-text-2">{label}</dt>
                <dd className="m-0 text-[17px] leading-[22px] font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          {range && (
            <div className="flex justify-between gap-3 text-[13px] leading-[18px] font-medium">
              <span className="text-text-2">{copy.restore.range}</span>
              <span>
                {monthLabel(range.from)} – {monthLabel(range.to)}
              </span>
            </div>
          )}
        </section>

        <section className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-4">
          <span className="flex flex-col">
            <span className="text-xs leading-4 font-medium text-text-2">{copy.restore.now}</span>
            <span className="font-semibold tabular-nums">{copy.restore.count(currentCount)}</span>
          </span>
          <ArrowRight size={18} className="text-text-2" aria-hidden="true" />
          <span className="flex flex-col text-right">
            <span className="text-xs leading-4 font-medium text-text-2">{copy.restore.inBackup}</span>
            <span className="font-semibold tabular-nums">{copy.restore.count(counts.transactions)}</span>
          </span>
        </section>

        <div role="note" className="flex gap-3 rounded-2xl bg-expense-soft p-4 text-text">
          <TriangleAlert size={20} className="mt-px shrink-0 text-expense" aria-hidden="true" />
          <p className="m-0 text-[13px] leading-[18px] font-medium">{copy.restore.warning}</p>
        </div>

        <label htmlFor={checkboxId} className="flex items-start gap-3 py-1">
          <input
            id={checkboxId}
            type="checkbox"
            checked={backupFirst}
            className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
            onChange={(e) => setBackupFirst(e.target.checked)}
          />
          <span>{copy.restore.backupFirst}</span>
        </label>
      </div>
    </Sheet>
  );
}

