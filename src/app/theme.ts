// Tema tercihi cihaza özgüdür ve localStorage'da tutulur (SPEC §4).
// İlk render öncesi uygulama public/theme-init.js'tedir; mantık aynı kalmalı.

export type ThemePref = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_KEY = 'theme';

const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#F7F7F5',
  dark: '#111214',
};

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function parseThemePref(value: string | null): ThemePref {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): ResolvedTheme {
  if (pref === 'system') return systemDark ? 'dark' : 'light';
  return pref;
}

export function readThemePref(): ThemePref {
  try {
    return parseThemePref(localStorage.getItem(THEME_KEY));
  } catch {
    return 'system';
  }
}

export function writeThemePref(pref: ThemePref): void {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Depolama kapalıysa tercih yalnızca bu oturumda geçerli olur.
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

export function applyTheme(pref: ThemePref): ResolvedTheme {
  const resolved = resolveTheme(pref, systemPrefersDark());
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved]);
  return resolved;
}

/** Tercih "Sistem" iken işletim sistemi teması değişince yeniden uygular. */
export function watchSystemTheme(getPref: () => ThemePref): () => void {
  const media = window.matchMedia(DARK_QUERY);
  const onChange = () => {
    if (getPref() === 'system') applyTheme('system');
  };
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
