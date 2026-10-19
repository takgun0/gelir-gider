import { expect, it } from 'vitest';

// scripts/test.mjs testleri iki saat diliminde çalıştırır; TZ'nin gerçekten
// uygulandığını doğrular (Windows dahil).
it('TZ ortam değişkeni uygulanmış', () => {
  const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
  const tz = env?.TZ;
  if (!tz) return;
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(tz);
  const offset = new Date(2026, 0, 15).getTimezoneOffset();
  expect(offset).toBe(tz === 'Europe/Istanbul' ? -180 : 480);
});
