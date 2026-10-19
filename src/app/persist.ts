// İlk işlem kaydedildiğinde kalıcı depolama istenir (Gereksinimler §5.6, Tasarım §9); böylece
// tarayıcı yer açarken verileri kendiliğinden silmez.
export async function requestPersistentStorage(): Promise<void> {
  try {
    const storage = navigator.storage as StorageManager | undefined;
    if (!storage?.persist || (await storage.persisted())) return;
    await storage.persist();
  } catch {
    // Desteklenmiyorsa sessizce geçilir.
  }
}
