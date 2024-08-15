// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath, URL } from 'node:url';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import checker from 'vite-plugin-checker';

const appName = 'TTG Club';

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  appId: 'ttg-club',

  app: {
    seoMeta: {
      mobileWebAppCapable: 'yes',
      appleMobileWebAppCapable: 'yes',
      applicationName: appName,
    },
    head: {
      charset: 'utf-8',
      link: [
        { rel: 'manifest', url: '/manifest.json', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://img.ttg.club', crossorigin: '' },
        { rel: 'dns-prefetch', href: 'https://img.ttg.club', crossorigin: '' },
        { type: 'image/svg+xml', url: '/favicon.svg' },
        { type: 'image/png', url: '/favicon.png' },
        { sizes: '192x192', url: '/icons/192.png' },
        ...[48, 72, 96, 144, 192, 256, 384, 512].map((size) => ({
          sizes: `${size}x${size}`,
          url: `/icons/${size}.png`,
        })),
      ],
      title: `${appName} Oнлайн-справочник`,
      titleTemplate: '%pageTitle %separator %siteName',
      viewport:
        'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
    },
    rootAttrs: {
      id: 'ttg-club',
      class: 'ttg-club',
    },
  },

  seo: {
    redirectToCanonicalSiteUrl: true,
    fallbackTitle: false,
  },

  site: {
    url: 'https://ttg.club',
    name: `${appName} Oнлайн-справочник`,
    description: `${appName} - сайт, посвященный DnD 5-й редакции. Тут можно найти: расы, происхождения, классы, заклинания, бестиарий, снаряжение, магические предметы и инструменты для облегчения игры как игрокам, так и мастерам - все в одном месте.`,
    defaultLocale: 'ru',
    indexable: false, // TODO: Вернуть на релизе для прода
  },

  typescript: {
    typeCheck: false,
  },

  eslint: {
    checker: false,
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/variables" as *;',
        },
      },
    },
    plugins: [
      createSvgIconsPlugin({
        iconDirs: [fileURLToPath(new URL('./assets/icons', import.meta.url))],
        symbolId: 'ttg-[dir]-[name]',
        svgoOptions: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: { removeViewBox: false },
              },
            },
            {
              name: 'removeAttrs',
              params: {
                attrs: '(width|height|style|color|fill|stroke)',
              },
            },
          ],
        },
      }),
      checker({
        enableBuild: true,
        terminal: false,
        vueTsc: true,
        eslint: {
          lintCommand:
            'eslint . --cache --cache-strategy content --ignore-pattern .eslintignore --quiet',
          dev: {
            logLevel: ['error'],
          },
        },
        stylelint: {
          lintCommand:
            'stylelint "{**/*,*}.{css,scss,vue}" --cache --cache-strategy content --ignore-path .eslintignore --quiet',
          dev: {
            logLevel: ['error'],
          },
        },
      }),
    ],
  },

  modules: [
    '@ant-design-vue/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/google-fonts',
    'dayjs-nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/device',
    '@nuxtjs/robots',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/seo',
  ],
});
