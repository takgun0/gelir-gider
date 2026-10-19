// Cihaza özgü tercihler (Gereksinimler §4): tema ve tutar gizleme. localStorage'da tutulur,
// yedeğe girmez; ilk render'dan önce okunur.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyTheme, readThemePref, watchSystemTheme, writeThemePref, type ThemePref } from './theme';

export const HIDE_AMOUNTS_KEY = 'hideAmounts';

export function readHideAmounts(): boolean {
  try {
    return localStorage.getItem(HIDE_AMOUNTS_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeHideAmounts(hide: boolean): void {
  try {
    if (hide) localStorage.setItem(HIDE_AMOUNTS_KEY, 'true');
    else localStorage.removeItem(HIDE_AMOUNTS_KEY);
  } catch {
    // Depolama kapalıysa tercih yalnızca bu oturumda geçerli olur.
  }
}

interface Prefs {
  theme: ThemePref;
  setTheme: (pref: ThemePref) => void;
  hideAmounts: boolean;
  setHideAmounts: (hide: boolean) => void;
}

const PrefsContext = createContext<Prefs | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>(readThemePref);
  const [hideAmounts, setHideState] = useState<boolean>(readHideAmounts);

  useEffect(() => {
    applyTheme(theme);
    return watchSystemTheme(() => theme);
  }, [theme]);

  const setTheme = useCallback((pref: ThemePref) => {
    writeThemePref(pref);
    setThemeState(pref);
  }, []);

  const setHideAmounts = useCallback((hide: boolean) => {
    writeHideAmounts(hide);
    setHideState(hide);
  }, []);

  const value = useMemo(() => ({ theme, setTheme, hideAmounts, setHideAmounts }), [theme, setTheme, hideAmounts, setHideAmounts]);
  return <PrefsContext value={value}>{children}</PrefsContext>;
}

export function usePrefs(): Prefs {
  const value = useContext(PrefsContext);
  if (!value) throw new Error('PrefsProvider eksik');
  return value;
}
