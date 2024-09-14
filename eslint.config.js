import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import gitignore from 'eslint-config-flat-gitignore';
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt(
  {
    features: {
      tooling: true,
    },
  },
  {
    rules: {
      'no-debugger': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-underscore-dangle': 'off',
      'no-use-before-define': 'off',
      'no-alert': ['error'],
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 1 }],
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
      'spaced-comment': ['error', 'always'],
      'camelcase': ['error'],
      'curly': ['error', 'all'],
      'guard-for-in': ['error'],
      'default-param-last': ['error'],
      'lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: false },
      ],
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: [
            'block-like',
            'break',
            'class',
            'const',
            'debugger',
            'directive',
            'export',
            'throw',
            'try',
            'function',
            'import',
          ],
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: [
            'block-like',
            'break',
            'class',
            'const',
            'continue',
            'debugger',
            'directive',
            'return',
            'throw',
            'try',
            'export',
            'function',
            'import',
          ],
        },
        { blankLine: 'always', prev: 'block', next: 'block' },
        {
          blankLine: 'always',
          prev: '*',
          next: [
            'multiline-const',
            'multiline-expression',
            'multiline-let',
            'multiline-var',
          ],
        },
        { blankLine: 'never', prev: 'break', next: 'case' },
        { blankLine: 'never', prev: 'break', next: 'default' },
        {
          blankLine: 'any',
          prev: 'singleline-const',
          next: 'singleline-const',
        },
        { blankLine: 'any', prev: 'singleline-let', next: 'singleline-let' },
        { blankLine: 'any', prev: 'singleline-var', next: 'singleline-var' },
        { blankLine: 'any', prev: 'import', next: 'import' },
      ],
      'class-methods-use-this': ['error', { enforceForClassFields: false }],

      // Vue.js
      'vue/require-explicit-emits': ['error'],
      'vue/padding-line-between-tags': [
        'error',
        [
          {
            blankLine: 'always',
            prev: '*',
            next: '*',
          },
        ],
      ],
      'vue/html-self-closing': ['error'],
      'vue/html-closing-bracket-spacing': [
        'error',
        {
          startTag: 'never',
          endTag: 'never',
          selfClosingTag: 'always',
        },
      ],
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: 1,
          multiline: 1,
        },
      ],
      'vue/first-attribute-linebreak': [
        'error',
        {
          singleline: 'ignore',
          multiline: 'below',
        },
      ],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/prefer-separate-static-class': 'off',
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/block-lang': [
        'error',
        {
          script: {
            lang: 'ts',
          },
        },
      ],
      'vue/valid-v-slot': 'off',
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/no-ref-object-reactivity-loss': ['warn'],
      'vue/match-component-import-name': ['error'],
      'vue/no-empty-component-block': ['error'],
      'vue/no-multiple-objects-in-class': ['error'],
      'vue/no-static-inline-styles': ['error', { allowBinding: true }],
      'vue/no-use-v-else-with-v-for': ['error'],
      'vue/no-useless-mustaches': [
        'error',
        {
          ignoreIncludesComment: true,
          ignoreStringEscape: true,
        },
      ],
      'vue/no-v-text': ['error'],
      'vue/prefer-define-options': ['error'],
      'vue/require-typed-object-prop': ['error'],
      'vue/require-typed-ref': ['error'],
      'vue/v-for-delimiter-style': ['error', 'in'],
      'vue/no-restricted-v-bind': 'off',
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        {
          registeredComponentsOnly: false,
        },
      ],
      'vue/custom-event-name-casing': 'off',

      // Vue.js Accessibility
      'vuejs-accessibility/anchor-has-content': 'off',
      'vuejs-accessibility/click-events-have-key-events': 'off',
      'vuejs-accessibility/mouse-events-have-key-events': 'off',
      'vuejs-accessibility/label-has-for': 'off',
      'vuejs-accessibility/no-autofocus': 'off',
      'vuejs-accessibility/form-control-has-label': 'off',

      // Typescript
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },
  eslintPluginPrettierRecommended,
  gitignore(),
);
