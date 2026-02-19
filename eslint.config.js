import { configure } from '@svifty7/eslint-config';

import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  configure({
    prettier: {
      tailwindStylesheet: './app/assets/css/tailwind.css',
    },
    ignores: ['.agents', 'AGENTS.md'],
  }).overrideRules({
    'vue/multi-word-component-names': undefined,
  }),
);
