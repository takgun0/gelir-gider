// İşlem formunun uygulama genelindeki giriş noktası: + butonu, N kısayolu, satıra
// dokunma, planlanan satır ve "Sabit işlemi düzenle →".
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { db } from '../db/db';
import { TransactionForm, type FormMode } from '../ui/tx/TransactionForm';

interface TxSheetApi {
  /** repeat: "Her ay tekrarla" açık başlar (İşlemler › Sabit "+ Ekle"). */
  openNew: (options?: { repeat?: boolean }) => void;
  openEdit: (transactionId: string) => void;
  openRecurring: (recurringId: string) => void;
}

const TxSheetContext = createContext<TxSheetApi | null>(null);

export function TxSheetProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<{ key: number; mode: FormMode } | null>(null);

  const show = useCallback((next: FormMode) => setMode((prev) => ({ key: (prev?.key ?? 0) + 1, mode: next })), []);

  const openNew = useCallback((options?: { repeat?: boolean }) => show({ kind: 'new', repeat: options?.repeat ?? false }), [show]);

  const openEdit = useCallback(
    (id: string) => {
      void db.transactions.get(id).then((tx) => tx && show({ kind: 'edit', tx }));
    },
    [show],
  );

  const openRecurring = useCallback(
    (id: string) => {
      void db.recurrings.get(id).then((recurring) => recurring && show({ kind: 'recurring', recurring }));
    },
    [show],
  );

  const value = useMemo(() => ({ openNew, openEdit, openRecurring }), [openNew, openEdit, openRecurring]);

  return (
    <TxSheetContext value={value}>
      {children}
      {mode && (
        <TransactionForm
          key={mode.key}
          mode={mode.mode}
          onClose={() => setMode(null)}
          onOpenRecurring={(id) => {
            setMode(null);
            openRecurring(id);
          }}
        />
      )}
    </TxSheetContext>
  );
}

export function useTxSheet(): TxSheetApi {
  const value = useContext(TxSheetContext);
  if (!value) throw new Error('TxSheetProvider eksik');
  return value;
}
