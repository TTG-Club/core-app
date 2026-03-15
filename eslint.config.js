import { configure } from '@svifty7/eslint-config';

import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  configure({
    stylistic: {
      semi: true,
    },
    vue: {
      a11y: true,
    },
    ignores: ['.agents', 'AGENTS.md'],
  }).overrideRules({
    'vue/multi-word-component-names': undefined,
  }),
);
