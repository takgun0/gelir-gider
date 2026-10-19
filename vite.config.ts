/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Yayın yolu yalnızca burada tanımlanır. Custom domain kullanılırsa '/' yapılır
// ya da derleme sırasında BASE_PATH ortam değişkeniyle verilir.
const BASE = process.env.BASE_PATH ?? '/gelir-gider/';

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
