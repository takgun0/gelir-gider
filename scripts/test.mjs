// SPEC §9: testler iki saat diliminde çalışır. npm script'inde `TZ=...` yazımı
// Windows'ta çalışmadığı için Vitest buradan, ortam değişkeniyle başlatılır.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const vitest = fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url));
const zones = ['Europe/Istanbul', 'America/Los_Angeles'];
const extraArgs = process.argv.slice(2);

for (const tz of zones) {
  console.log(`\n▶ TZ=${tz}`);
  const result = spawnSync(process.execPath, [vitest, 'run', ...extraArgs], {
    stdio: 'inherit',
    env: { ...process.env, TZ: tz },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
