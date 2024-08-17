/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-clean-order/error'],

  // ignorePatterns: [
  //   '**/node_modules',
  //   '**/dist',
  //
  //   '**/output',
  //   '**/coverage',
  //   '**/temp',
  //   '**/.temp',
  //   '**/tmp',
  //   '**/.tmp',
  //   '**/.history',
  //   '**/.vitepress/cache',
  //   '**/.nuxt',
  //   '**/.next',
  //   '**/.svelte-kit',
  //   '**/.vercel',
  //   '**/.changeset',
  //   '**/.idea',
  //   '**/.cache',
  //   '**/.output',
  //   '**/.vite-inspect',
  //   '**/.yarn',
  //   '**/vite.config.*.timestamp-*',
  //
  //   '**/*.min.*',
  // ],

  rules: {
    'font-family-no-missing-generic-family-keyword': true,
    'declaration-block-no-shorthand-property-overrides': true,
    'annotation-no-unknown': true,
    'length-zero-no-unit': true,
  },

  overrides: [
    {
      files: ['**/*.(scss|css|vue)'],
      customSyntax: 'postcss-scss',
    },
    {
      files: ['**/*.(html|vue)'],
      customSyntax: 'postcss-html',
    },
  ],
};
