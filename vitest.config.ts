import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Юнит-тесты доменной логики.
 *
 * Окружение Nuxt намеренно не поднимается: под проверкой чистые модули —
 * схемы разбора, сборка запросов, права по ролям и склейка ленты чата. Им
 * нужны только алиасы проекта и те немногие авто-импорты, которые они
 * используют; всё это даёт `test/setup.ts`, подставляя настоящие реализации,
 * а не заглушки.
 */
export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '#server': fileURLToPath(new URL('./server', import.meta.url)),
      '~find-game': fileURLToPath(
        new URL('./app/features/find-game', import.meta.url),
      ),
      '~nexus': fileURLToPath(new URL('./app/features/nexus', import.meta.url)),
      '~initiative': fileURLToPath(
        new URL('./app/features/initiative', import.meta.url),
      ),
      '~character-sheet': fileURLToPath(
        new URL('./app/features/character-sheet', import.meta.url),
      ),
      '~ui': fileURLToPath(new URL('./app/shared/ui', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
