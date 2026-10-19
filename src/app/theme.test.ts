import { describe, expect, it } from 'vitest';
import { parseThemePref, resolveTheme } from './theme';

describe('tema', () => {
  it('bilinmeyen ya da boş değeri Sistem sayar', () => {
    expect(parseThemePref(null)).toBe('system');
    expect(parseThemePref('blue')).toBe('system');
    expect(parseThemePref('dark')).toBe('dark');
    expect(parseThemePref('light')).toBe('light');
  });

  it('Sistem tercihini işletim sistemine göre çözer', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
