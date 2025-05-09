import { createConfigForNuxt } from '@nuxt/eslint-config';
import gitignore from 'eslint-config-flat-gitignore';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

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
      'no-param-reassign': ['error', { props: false }],
      'no-irregular-whitespace': [
        'error',
        {
          skipStrings: true,
          skipTemplates: true,
          skipJSXText: true,
          skipComments: true,
        },
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
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'never',
            normal: 'always',
            component: 'always',
          },
          svg: 'always',
          math: 'always',
        },
      ],
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
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
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
      'vue/valid-v-slot': 'off',
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/no-ref-object-reactivity-loss': ['error'],
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
      'vue/match-component-file-name': [
        'error',
        { extensions: ['tsx', 'ts', 'vue'], shouldMatchCase: true },
      ],
      'vue/component-options-name-casing': ['error', 'PascalCase'],
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        {
          registeredComponentsOnly: false,
        },
      ],
      'vue/padding-line-between-blocks': ['error'],
      'vue/prefer-true-attribute-shorthand': ['error'],
      'vue/no-deprecated-delete-set': ['error'],
      'vue/no-deprecated-model-definition': ['error'],
      'vue/no-required-prop-with-default': [
        'error',
        {
          autofix: true,
        },
      ],
      'vue/valid-define-options': ['error'],
      'vue/valid-define-emits': ['error'],
      'vue/valid-define-props': ['error'],

      // Vue.js Accessibility
      'vuejs-accessibility/anchor-has-content': 'off',
      'vuejs-accessibility/click-events-have-key-events': 'off',
      'vuejs-accessibility/mouse-events-have-key-events': 'off',
      'vuejs-accessibility/label-has-for': 'off',
      'vuejs-accessibility/no-autofocus': 'off',
      'vuejs-accessibility/form-control-has-label': 'off',

      // Typescript
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/no-dynamic-delete': 'error',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          enums: false,
          typedefs: false,
          ignoreTypeReferences: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          vars: 'all',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],

      // Import
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-named-default': 'error',
      'import/no-self-import': 'error',
      'import/newline-after-import': ['error', { count: 1 }],
      'import/no-named-as-default-member': 'off',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          'warnOnUnassignedImports': false,
          'pathGroupsExcludedImportTypes': ['builtin'],
          'alphabetize': {
            order: 'asc',
            orderImportKind: 'asc',
            caseInsensitive: true,
          },
          'groups': [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'unknown',
            'type',
            'object',
          ],
        },
      ],
    },
  },
  eslintPluginPrettierRecommended,
  gitignore(),
);
