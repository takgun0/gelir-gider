// Güncelleme akışı (SPEC §7): registerType 'prompt'. Yeni sürüm hazır olunca
// "Yeni sürüm hazır · Yenile" bildirimi; başka sekme veritabanı sürümünü yükseltirse
// bağlantı kapatılır ve yenileme istenir.
import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { db } from '../db/db';
import { copy } from '../ui/copy';
import { useToast } from './toast';

export function UpdateWatcher() {
  const toast = useToast();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;
    toast({
      message: copy.toast.updateReady,
      persistent: true,
      action: { label: copy.toast.reload, onAction: () => void updateServiceWorker(true) },
    });
  }, [needRefresh, toast, updateServiceWorker]);

  useEffect(() => {
    const onVersionChange = () => {
      db.close();
      toast({
        message: copy.toast.dbUpgraded,
        persistent: true,
        action: { label: copy.toast.reload, onAction: () => window.location.reload() },
      });
      return false;
    };
    db.on('versionchange', onVersionChange);
    return () => db.on('versionchange').unsubscribe(onVersionChange);
  }, [toast]);

  return null;
}
