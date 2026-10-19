// İşlem ekle/düzenle sayfasının uygulama genelindeki giriş noktası (+ butonu, N kısayolu).
// Form Faz 6'da yazılır; şimdilik boş sayfa açılır.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Button } from '../ui/components/Button';
import { Sheet } from '../ui/components/Sheet';
import { copy } from '../ui/copy';

interface TxSheetApi {
  openNew: () => void;
}

const TxSheetContext = createContext<TxSheetApi | null>(null);

export function TxSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openNew = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openNew }), [openNew]);

  return (
    <TxSheetContext value={value}>
      {children}
      {open && (
        <Sheet
          title={copy.sheet.newTransaction}
          onRequestClose={() => setOpen(false)}
          footer={<Button onClick={() => setOpen(false)}>{copy.sheet.save}</Button>}
        >
          <div className="min-h-[50dvh]" />
        </Sheet>
      )}
    </TxSheetContext>
  );
}

export function useTxSheet(): TxSheetApi {
  const value = useContext(TxSheetContext);
  if (!value) throw new Error('TxSheetProvider eksik');
  return value;
}
