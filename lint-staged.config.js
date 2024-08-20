/** @type {import('lint-staged').Config} */
export default {
  '*.{js,jsx,cjs,mjs,ts,tsx,cts,mts,vue}':
    'eslint --cache --cache-strategy content --quiet --fix',
  '*.{ts,tsx,cts,mts,vue}': () => 'vue-tsc -p tsconfig.json',
  '*.{css,scss,vue}':
    'stylelint --cache --cache-strategy content --ignore-path .gitignore --quiet --fix',
};
