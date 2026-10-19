/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// Yayın yolu yalnızca burada tanımlanır. Custom domain kullanılırsa '/' yapılır
// ya da derleme sırasında BASE_PATH ortam değişkeniyle verilir.
const BASE = process.env.BASE_PATH ?? '/gelir-gider/';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// SPEC §5.7: CSP yalnızca production build'e eklenir.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function cspMeta(): Plugin {
  return {
    name: 'gelir-gider-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
    },
  };
}

/** Android açılış ekranı tek renk: iki temada da göze batmayan nötr ton (DECISIONS). */
const SPLASH_BACKGROUND = '#6B6862';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    cspMeta(),
    VitePWA({
      registerType: 'prompt',
      // Kayıt uygulama kodundan yapılır; inline script üretilmez (SPEC §5.7).
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'theme-init.js'],
      manifest: {
        name: 'Gelir Gider',
        short_name: 'Gelir Gider',
        description: 'Aylık gelir ve giderini çevrimdışı takip et.',
        lang: 'tr',
        dir: 'ltr',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        background_color: SPLASH_BACKGROUND,
        theme_color: '#F7F7F5',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: `${BASE}index.html`,
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    target: 'es2022',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'charts', test: /node_modules[\\/](recharts|victory-vendor|d3-|@reduxjs|immer|reselect|es-toolkit|decimal\.js-light|eventemitter3)/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|use-sync-external-store)[\\/]/ },
            { name: 'data', test: /node_modules[\\/](dexie|dexie-react-hooks|zod)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
