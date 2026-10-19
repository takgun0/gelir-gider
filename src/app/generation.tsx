// Sabit işlem üretiminin uygulamadaki tetikleyicileri (SPEC §5.3): açılışta ilk
// render'dan önce (main.tsx) ve sayfa yeniden görünür olduğunda. En az bir işlem
// üretildiyse tek bildirim: "N sabit işlem eklendi".
import { useEffect } from 'react';
import { contextFrom } from '../db/context';
import { db } from '../db/db';
import { runGeneration } from '../db/ops/generation';
import { copy } from '../ui/copy';
import { useToast } from './toast';

export async function generateNow(): Promise<number> {
  try {
    return await runGeneration(db, contextFrom());
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export function GenerationWatcher({ initialCount }: { initialCount: number }) {
  const toast = useToast();

  useEffect(() => {
    if (initialCount > 0) toast({ message: copy.toast.generated(initialCount) });
  }, [initialCount, toast]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void generateNow().then((n) => {
        if (n > 0) toast({ message: copy.toast.generated(n) });
      });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [toast]);

  return null;
}
