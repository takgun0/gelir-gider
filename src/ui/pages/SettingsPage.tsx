// Ayarlar (Tasarım §6.6): Görünüm, Verilerin, Tehlikeli bölge, Hakkında.
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { CircleAlert } from 'lucide-react';
import { Download } from 'lucide-react';
import { FileSpreadsheet } from 'lucide-react';
import { History } from 'lucide-react';
import { Info } from 'lucide-react';
import { Map as MapIcon } from 'lucide-react';
import { SquarePlus } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { Upload } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useId, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { isIos, isStandalone, saveFile } from '../../app/download';
import { useTour } from '../../app/onboarding';
import { useSelectedMonth } from '../../app/month';
import { usePrefs } from '../../app/prefs';
import type { ThemePref } from '../../app/theme';
import { useToday } from '../../app/today';
import { useToast } from '../../app/toast';
import { backupFileName, isFileTooLarge, parseBackup, serializeBackup, type BackupFile, type RestorePreview } from '../../domain/backup';
import { csvFileName } from '../../domain/csv';
import { diffDays, toDateStr } from '../../domain/date';
import { matchesConfirmWord } from '../../domain/text';
import { contextFrom } from '../../db/context';
import { db } from '../../db/db';
import { createBackup, deleteAllData, exportCsv, getSettings, markBackupTaken, restoreBackup, transactionCount } from '../../db/ops/data';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Segmented } from '../components/controls';
import { Page, PageTitle } from '../components/Page';
import { copy } from '../copy';
import { RestoreSheet } from '../settings/RestoreSheet';

/** Bu kadar günü geçen yedek vurgulanır (Tasarım §6.6). */
const STALE_DAYS = 30;

function Section({ title, danger = false, children }: { title: string; danger?: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className={`m-0 px-1 text-[13px] leading-[18px] font-semibold ${danger ? 'text-expense' : 'text-text-2'}`}>{title}</h2>
      {children}
    </section>
  );
}

function ActionRow({ icon: Icon, title, hint, onClick }: { icon: LucideIcon; title: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" className="flex min-h-16 items-center gap-3 text-left" onClick={onClick}>
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{title}</span>
        <span className="truncate text-[13px] leading-[18px] font-medium text-text-2">{hint}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-text-2" aria-hidden="true" />
    </button>
  );
}

interface PendingRestore {
  fileName: string;
  backup: BackupFile;
  preview: RestorePreview;
  currentCount: number;
}

export function SettingsPage() {
  const { theme, setTheme } = usePrefs();
  const { openTour } = useTour();
  const today = useToday();
  const toast = useToast();
  const navigate = useNavigate();
  const { setPeriod, current } = useSelectedMonth();
  const settings = useLiveQuery(() => getSettings(db), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [restore, setRestore] = useState<PendingRestore | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [confirmText, setConfirmText] = useState('');
  const confirmId = useId();

  const lastBackupAt = settings?.lastBackupAt;
  const daysSince = lastBackupAt !== undefined ? diffDays(toDateStr(new Date(lastBackupAt)), today) : null;
  const stale = daysSince === null || daysSince > STALE_DAYS;
  const lastBackupLabel =
    daysSince === null
      ? copy.settings.neverBackedUp
      : daysSince <= 0
        ? copy.settings.backupToday
        : daysSince === 1
          ? copy.settings.backupYesterday
          : copy.settings.daysAgo(daysSince);

  const downloadBackup = async (): Promise<boolean> => {
    const now = new Date();
    const saved = await saveFile(backupFileName(today), serializeBackup(await createBackup(db, now)), 'application/json');
    if (saved) await markBackupTaken(db, now.getTime());
    return saved;
  };

  const onBackup = async () => {
    if (await downloadBackup()) toast({ message: copy.toast.backupDownloaded });
  };

  const onCsv = async () => {
    if (await saveFile(csvFileName(today), await exportCsv(db), 'text/csv;charset=utf-8')) {
      toast({ message: copy.toast.csvDownloaded });
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const invalid = () => toast({ message: copy.errors.backupInvalid, tone: 'error' });
    if (isFileTooLarge(file.size)) return invalid();
    let text: string;
    try {
      text = await file.text();
    } catch {
      return invalid();
    }
    const result = parseBackup(text);
    if (!result.ok) {
      toast({ message: result.error === 'newer' ? copy.errors.backupNewer : copy.errors.backupInvalid, tone: 'error' });
      return;
    }
    setRestore({ fileName: file.name, backup: result.backup, preview: result.preview, currentCount: await transactionCount(db) });
  };

  const onRestore = async (backupFirst: boolean) => {
    if (!restore) return;
    setBusy(true);
    try {
      if (backupFirst && !(await downloadBackup())) return;
      await restoreBackup(db, restore.backup, contextFrom());
      setRestore(null);
      toast({ message: copy.toast.restored });
    } finally {
      setBusy(false);
    }
  };

  const onDeleteAll = async () => {
    await deleteAllData(db, contextFrom());
    setDeleteStep(0);
    setConfirmText('');
    setPeriod(current);
    void navigate('/');
  };

  const installHint = isStandalone() ? null : isIos() ? copy.settings.installIos : copy.settings.installOther;

  return (
    <Page>
      <PageTitle>{copy.nav.settings}</PageTitle>
      <div className="flex flex-col gap-6 lg:max-w-[640px]">
        <Section title={copy.settings.appearance}>
          <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
            <span className="font-medium">{copy.settings.theme}</span>
            <Segmented<ThemePref>
              label={copy.settings.theme}
              value={theme}
              options={[
                { value: 'light', label: copy.settings.themeLight },
                { value: 'dark', label: copy.settings.themeDark },
                { value: 'system', label: copy.settings.themeSystem },
              ]}
              onChange={setTheme}
            />
          </div>
        </Section>

        <Section title={copy.settings.data}>
          <div className="flex flex-col gap-1 rounded-2xl bg-surface p-4">
            <div className="mb-2 flex gap-3 rounded-xl bg-surface-2 p-3">
              <Info size={20} className="shrink-0 text-text-2" aria-hidden="true" />
              <p className="m-0 text-[13px] leading-[18px] font-medium text-text-2">{copy.settings.dataNote}</p>
            </div>
            <div className={`flex min-h-12 items-center gap-3 ${stale && settings ? 'text-accent' : ''}`}>
              {stale && settings ? (
                <CircleAlert size={20} className="shrink-0" aria-hidden="true" />
              ) : (
                <History size={20} className="shrink-0 text-text-2" aria-hidden="true" />
              )}
              <span className={`flex-1 ${stale && settings ? '' : 'text-text-2'}`}>{copy.settings.lastBackup}</span>
              <span className="font-medium">{settings ? lastBackupLabel : ''}</span>
            </div>
            <ActionRow icon={Download} title={copy.settings.downloadBackup} hint={backupFileName(today)} onClick={() => void onBackup()} />
            <ActionRow icon={FileSpreadsheet} title={copy.settings.exportCsv} hint={copy.settings.exportCsvHint} onClick={() => void onCsv()} />
            <ActionRow icon={Upload} title={copy.settings.restore} hint={copy.settings.restoreHint} onClick={() => fileRef.current?.click()} />
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              tabIndex={-1}
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
        </Section>

        <Section title={copy.settings.danger} danger>
          <div className="flex flex-col gap-3 rounded-2xl bg-expense-soft p-4">
            <p className="m-0 text-[13px] leading-[18px] font-medium">{copy.settings.dangerNote}</p>
            <button
              type="button"
              className="flex h-11 items-center gap-2 self-start rounded-xl bg-surface px-4 font-semibold text-expense"
              onClick={() => setDeleteStep(1)}
            >
              <Trash2 size={18} aria-hidden="true" />
              {copy.settings.deleteAll}
            </button>
          </div>
        </Section>

        <Section title={copy.settings.about}>
          <div className="flex flex-col rounded-2xl bg-surface px-4 py-1">
            <div className="flex h-[52px] items-center">
              <span className="flex-1">{copy.settings.version}</span>
              <span className="text-text-2 tabular-nums">{__APP_VERSION__}</span>
            </div>
            <button
              type="button"
              className="flex min-h-14 items-center gap-3 py-2 text-left shadow-[inset_0_1px_0_var(--border)]"
              onClick={openTour}
            >
              <MapIcon size={20} className="shrink-0 text-text-2" aria-hidden="true" />
              <span className="flex flex-1 flex-col">
                <span className="font-medium">{copy.tour.replay}</span>
                <span className="text-[13px] leading-[18px] font-medium text-text-2">{copy.tour.replayHint}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-text-2" aria-hidden="true" />
            </button>
            {installHint && (
              <div className="flex gap-3 pt-3 pb-3.5 shadow-[inset_0_1px_0_var(--border)]">
                <SquarePlus size={20} className="shrink-0 text-text-2" aria-hidden="true" />
                <span className="flex flex-col">
                  <span className="font-medium">{copy.settings.install}</span>
                  <span className="text-[13px] leading-[18px] font-medium text-text-2">{installHint}</span>
                </span>
              </div>
            )}
          </div>
        </Section>
      </div>

      {restore && (
        <RestoreSheet
          fileName={restore.fileName}
          preview={restore.preview}
          currentCount={restore.currentCount}
          busy={busy}
          onCancel={() => setRestore(null)}
          onConfirm={(backupFirst) => void onRestore(backupFirst)}
        />
      )}

      {deleteStep === 1 && (
        <ConfirmDialog
          step={copy.deleteAll.step1}
          title={copy.deleteAll.title}
          message={copy.deleteAll.body}
          confirmLabel={copy.deleteAll.continue}
          cancelLabel={copy.sheet.cancel}
          onCancel={() => setDeleteStep(0)}
          onConfirm={() => setDeleteStep(2)}
        />
      )}
      {deleteStep === 2 && (
        <ConfirmDialog
          step={copy.deleteAll.step2}
          title={copy.deleteAll.finalTitle}
          message={copy.deleteAll.finalBody}
          confirmLabel={copy.deleteAll.confirm}
          cancelLabel={copy.sheet.cancel}
          confirmDisabled={!matchesConfirmWord(confirmText, copy.deleteAll.word)}
          onCancel={() => {
            setDeleteStep(0);
            setConfirmText('');
          }}
          onConfirm={() => void onDeleteAll()}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor={confirmId} className="text-[13px] leading-[18px] font-medium text-text-2">
              {copy.deleteAll.typeLabel}
            </label>
            <input
              id={confirmId}
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={confirmText}
              className="h-12 rounded-xl bg-surface-2 px-3.5 text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matchesConfirmWord(confirmText, copy.deleteAll.word)) void onDeleteAll();
              }}
            />
          </div>
        </ConfirmDialog>
      )}
    </Page>
  );
}
