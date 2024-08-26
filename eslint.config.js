import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt(
  {
    features: {
      tooling: true,
    },
  },
  {
    rules: {
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
);
