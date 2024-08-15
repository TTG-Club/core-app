import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import pluginVue from 'eslint-plugin-vue';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default createConfigForNuxt({
  features: {
    tooling: true,
    typescript: true,
    stylistic: {
      semi: true,
      arrowParens: true,
      braceStyle: '1tbs',
    },
  },
}).append(
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
      '@stylistic/indent': 'off',
      'no-debugger': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-underscore-dangle': 'off',
      'no-use-before-define': 'off',
      'no-alert': ['error'],
      'consistent-return': ['warn'],
      'no-continue': 'off',
      'no-await-in-loop': 'off',
      'no-nested-ternary': ['warn'],
      'no-return-assign': ['warn'],
      'no-bitwise': 'off',
      'no-plusplus': 'off',
      'no-restricted-syntax': [
        'error',
        'ForInStatement',
        'LabeledStatement',
        'WithStatement',
      ],
      'no-unused-vars': 'off',
      'no-param-reassign': [
        'error',
        { props: true, ignorePropertyModificationsFor: ['state'] },
      ],
      'dot-notation': ['error'],
      'require-await': ['error'],
      'camelcase': ['error'],
      'curly': ['error', 'all'],
      'guard-for-in': ['error'],
      'default-param-last': ['error'],
      'class-methods-use-this': ['error', { enforceForClassFields: false }],

      // Vue.js
      'vue/html-indent': [
        'error',
        2,
        {
          attribute: 1,
          baseIndent: 1,
          closeBracket: 0,
          alignAttributesVertically: true,
          ignores: [],
        },
      ],
      'vue/html-comment-indent': ['error', 2],
      'vue/script-indent': [
        'error',
        2,
        {
          baseIndent: 1,
          switchCase: 1,
          ignores: [],
        },
      ],
      'vue/match-component-file-name': [
        'error',
        {
          extensions: ['jsx', 'js', 'tsx', 'ts', 'vue'],
          shouldMatchCase: true,
        },
      ],
      'vue/component-options-name-casing': ['error', 'PascalCase'],
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        { registeredComponentsOnly: false, ignores: [] },
      ],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/block-lang': [
        'error',
        {
          script: {
            lang: 'ts',
          },
        },
      ],
      'vue/require-explicit-emits': 'error',
      'vue/padding-line-between-tags': [
        'error',
        [{ blankLine: 'always', prev: '*', next: '*' }],
      ],
      'vue/valid-v-slot': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'any',
            normal: 'always',
            component: 'always',
          },
          svg: 'always',
          math: 'always',
        },
      ],
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/no-ref-object-reactivity-loss': ['warn'],
      'vue/match-component-import-name': ['error'],
      'vue/no-empty-component-block': ['error'],
      'vue/no-multiple-objects-in-class': ['error'],
      'vue/no-static-inline-styles': ['error', { allowBinding: true }],
      'vue/no-unused-refs': ['error'],
      'vue/no-use-v-else-with-v-for': ['error'],
      'vue/no-useless-mustaches': [
        'error',
        {
          ignoreIncludesComment: true,
          ignoreStringEscape: true,
        },
      ],
      'vue/no-v-text': ['error'],
      'vue/padding-line-between-blocks': ['error'],
      'vue/prefer-define-options': ['error'],
      'vue/require-typed-object-prop': ['error'],
      'vue/require-typed-ref': ['error'],
      'vue/v-for-delimiter-style': ['error', 'in'],
      'vue/component-tags-order': 'off',
      'vue/multi-word-component-names': 'off',

      // Vue.js Accessibility
      'vuejs-accessibility/anchor-has-content': 'off',
      'vuejs-accessibility/click-events-have-key-events': 'off',
      'vuejs-accessibility/mouse-events-have-key-events': 'off',
      'vuejs-accessibility/label-has-for': 'off',
      'vuejs-accessibility/no-autofocus': 'off',
      'vuejs-accessibility/form-control-has-label': 'off',

      // Typescript
      'no-shadow': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'after-used', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          enums: true,
          typedefs: true,
          ignoreTypeReferences: true,
          variables: true,
          classes: true,
        },
      ],
    },
  },
  eslintPluginPrettierRecommended,
);
