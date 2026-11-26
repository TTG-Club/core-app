import { configure } from '@svifty7/eslint-config';

import withNuxt from './.nuxt/eslint.config.mjs';

const config = configure({
  formatters: true,
  gitignore: true,
  jsdoc: true,
  jsonc: true,
  jsx: {
    a11y: true,
  },
  markdown: true,
  pnpm: true,
  test: true,
  toml: true,
  typescript: true,
  vue: {
    a11y: true,
  },
  yaml: true,
  prettier: {
    tailwindStylesheet: './app/assets/css/tailwind.css',
  },
  ignores: ['.agents', 'AGENTS.md'],
});

export default withNuxt(
  config.overrideRules({
    'vue/multi-word-component-names': undefined,
  }),
  {
    // В карте проекта таблица фич выровнена, и каждая её строка — тысячи
    // символов. Это правило перебирает строку со скобками за время, растущее
    // быстрее длины: на одной PROJECT_MAP.md уходили минуты, и сборка на
    // сервере вставала по таймауту. Ссылок со скобками там нет.
    files: ['PROJECT_MAP.md'],
    rules: {
      'markdown/no-reversed-media-syntax': 'off',
    },
  },
);
