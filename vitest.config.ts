import type { Plugin } from 'vitest/config';

import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Подменяет однофайловые компоненты пустым модулем. Модели фич тянут их через
 * barrel-файлы (`~ui/damage-formula` отдаёт и функции, и поля формы), а
 * компоненты тестам доменной логики не нужны и без Nuxt не собираются.
 */
const stubVueComponents: Plugin = {
  name: 'stub-vue-components',
  enforce: 'pre',
  load: (id) => (id.endsWith('.vue') ? 'export default {};' : null),
};

/**
 * Тесты доменной логики и жизненного цикла композаблов.
 *
 * Окружение Nuxt не поднимается. Общие авто-импорты предоставляет test/setup.ts;
 * тесты композаблов используют настоящую реактивность Vue и таймеры VueUse,
 * подменяя хранилище, сетевые API и окружение приложения в своих файлах.
 */
export default defineConfig({
  plugins: [stubVueComponents],
  resolve: {
    alias: {
      '~admin': fileURLToPath(new URL('./app/features/admin', import.meta.url)),
      '~home': fileURLToPath(new URL('./app/features/home', import.meta.url)),
      '~active-effects': fileURLToPath(
        new URL('./app/features/active-effects', import.meta.url),
      ),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '#server': fileURLToPath(new URL('./server', import.meta.url)),
      '~find-game': fileURLToPath(
        new URL('./app/features/find-game', import.meta.url),
      ),
      '~initiative': fileURLToPath(
        new URL('./app/features/initiative', import.meta.url),
      ),
      '~character-sheet': fileURLToPath(
        new URL('./app/features/character-sheet', import.meta.url),
      ),
      '~bestiary': fileURLToPath(
        new URL('./app/features/bestiary', import.meta.url),
      ),
      '~items': fileURLToPath(new URL('./app/features/items', import.meta.url)),
      '~magic-items': fileURLToPath(
        new URL('./app/features/magic-items', import.meta.url),
      ),
      '~spells': fileURLToPath(
        new URL('./app/features/spells', import.meta.url),
      ),
      '~ui': fileURLToPath(new URL('./app/shared/ui', import.meta.url)),
      '~infrastructure': fileURLToPath(
        new URL('./app/features/infrastructure', import.meta.url),
      ),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
