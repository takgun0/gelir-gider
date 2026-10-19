// Görünüm alanı yardımcıları: kırılım noktası ve ekran klavyesi (SPEC §6).
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

/** DESIGN §5: 640 px altı mobil. */
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 640px)');
}

/** Klavye açık kabul edilmesi için görünür alanın en az bu kadar küçülmesi gerekir. */
const KEYBOARD_THRESHOLD = 120;

/**
 * Ekran klavyesinin kapladığı yükseklik (px); kapalıyken 0. visualViewport ile ölçülür;
 * sabit Kaydet butonu bu kadar yukarı taşınır, alt çubuk gizlenir.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setInset(covered > KEYBOARD_THRESHOLD ? Math.round(covered) : 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
}

/**
 * Android Chrome'da klavye açılınca layout viewport da küçülür ve inset 0 kalır;
 * bu durumda bir giriş alanının odakta olması ve görünür alanın daralması birlikte
 * klavyenin açık olduğunu gösterir.
 */
export function useKeyboardOpen(): boolean {
  const inset = useKeyboardInset();
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const baseline = { height: window.innerHeight };
    const editable = () => {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable);
    };
    const update = () => {
      if (!editable()) baseline.height = Math.max(baseline.height, window.innerHeight);
      setShrunk(editable() && baseline.height - window.innerHeight > KEYBOARD_THRESHOLD);
    };
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);
  return inset > 0 || shrunk;
}
