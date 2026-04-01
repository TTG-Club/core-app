import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~dice-roller': fileURLToPath(
        new URL('./app/features/dice-roller', import.meta.url),
      ),
      '#components': fileURLToPath(
        new URL('./.nuxt/components', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['app/**/__tests__/**/*.test.ts'],
  },
});
