// Görünüm alanı yardımcıları: kırılım noktası ve ekran klavyesi (Gereksinimler §6).
import { useEffect, useState, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tasarım §5: 640 px altı mobil. */
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 640px)');
}

/** Klavye açık kabul edilmesi için görünür alanın en az bu kadar küçülmesi gerekir. */
const KEYBOARD_THRESHOLD = 120;

function editableFocused(): boolean {
  const el = document.activeElement;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !['button', 'checkbox', 'radio', 'submit', 'range', 'color', 'file'].includes(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

interface KeyboardState {
  open: boolean;
  /** iOS'ta klavyenin layout viewport üzerinde kapladığı yükseklik (px). */
  inset: number;
}

/**
 * Ekran klavyesi: yalnızca bir giriş alanı odaktayken açık sayılır.
 * - iOS: klavye layout viewport'u küçültmez; visualViewport ile kapladığı alan ölçülür.
 * - Android Chrome: layout viewport küçülür; odaktaki alan ve daralma birlikte klavye sayılır.
 */
function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({ open: false, inset: 0 });
  useEffect(() => {
    const vv = window.visualViewport;
    let baseline = window.innerHeight;
    const update = () => {
      const editing = editableFocused();
      if (!editing) baseline = window.innerHeight;
      const covered = vv ? window.innerHeight - vv.height - vv.offsetTop : 0;
      const inset = editing && covered > KEYBOARD_THRESHOLD ? Math.round(covered) : 0;
      const shrunk = editing && baseline - window.innerHeight > KEYBOARD_THRESHOLD;
      const open = inset > 0 || shrunk;
      setState((prev) => (prev.open === open && prev.inset === inset ? prev : { open, inset }));
    };
    const deferred = () => window.setTimeout(update, 0);
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', deferred);
    document.addEventListener('focusout', deferred);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', deferred);
      document.removeEventListener('focusout', deferred);
    };
  }, []);
  return state;
}

/** Sabit Kaydet butonunun klavyenin üstüne taşınacağı yükseklik; kapalıyken 0. */
export function useKeyboardInset(): number {
  return useKeyboard().inset;
}

/** Klavye açıkken alt çubuk gizlenir. */
export function useKeyboardOpen(): boolean {
  return useKeyboard().open;
}
