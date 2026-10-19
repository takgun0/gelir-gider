// Dosya indirme (SPEC §5.5 "İndirme"): Blob ve indirme bağlantısı. iOS'ta ana ekrandan
// açılan uygulamada indirme sorun çıkarabildiği için, paylaşım destekleniyorsa
// dosya paylaşım sayfasıyla kaydedilir.

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** true: dosya kullanıcıya verildi; false: kullanıcı paylaşımı iptal etti. */
export async function saveFile(name: string, content: string, type: string): Promise<boolean> {
  const blob = new Blob([content], { type });

  if (isIos() && isStandalone() && typeof navigator.canShare === 'function') {
    const file = new File([blob], name, { type });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return false;
        // Paylaşım başarısızsa indirme bağlantısına düşülür.
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
