import antfu from '@antfu/eslint-config';

import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  antfu({
    vue: true,
    typescript: true,
    formatters: {
      css: 'prettier',
      html: 'prettier',
      xml: 'prettier',
      markdown: 'prettier',
      graphql: 'prettier',
      prettierOptions: {
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: true,
        quoteProps: 'consistent',
        jsxSingleQuote: false,
        trailingComma: 'all',
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: 'always',
        requirePragma: false,
        insertPragma: false,
        proseWrap: 'preserve',
        htmlWhitespaceSensitivity: 'css',
        // vueIndentScriptAndStyle: true,
        endOfLine: 'lf',
        singleAttributePerLine: true,
      },
    },
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
      overrides: {
        'style/indent': [
          'error',
          2,
          {
            SwitchCase: 1,
            VariableDeclarator: 1,
            outerIIFEBody: 1,
            MemberExpression: 1,
            FunctionDeclaration: {
              parameters: 1,
              body: 1,
            },
            FunctionExpression: {
              parameters: 1,
              body: 1,
            },
            StaticBlock: {
              body: 1,
            },
            CallExpression: {
              arguments: 1,
            },
            ArrayExpression: 1,
            ObjectExpression: 1,
            ImportDeclaration: 1,
            flatTernaryExpressions: false,
            offsetTernaryExpressions: true,
            ignoreComments: false,
          },
        ],
        'style/arrow-parens': ['error', 'always'],
        'antfu/top-level-function': 'off',
      },
    },
  })
    .override('antfu/imports/rules', {
      rules: {
        'import/order': ['error', { 'newlines-between': 'always' }],
      },
    })
    .override('antfu/vue/rules', {
      rules: {
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
        'vue/require-explicit-emits': ['error'],
        'vue/padding-line-between-tags': [
          'error',
          [{ blankLine: 'always', prev: '*', next: '*' }],
        ],
        'vue/valid-v-slot': 'off',
        'vue/html-self-closing': ['error'],
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

        // Vue.js Accessibility
        'vuejs-accessibility/anchor-has-content': 'off',
        'vuejs-accessibility/click-events-have-key-events': 'off',
        'vuejs-accessibility/mouse-events-have-key-events': 'off',
        'vuejs-accessibility/label-has-for': 'off',
        'vuejs-accessibility/no-autofocus': 'off',
        'vuejs-accessibility/form-control-has-label': 'off',
      },
    }),
);
