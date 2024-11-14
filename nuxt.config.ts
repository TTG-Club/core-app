// https://nuxt.com/docs/api/configuration/nuxt-config
import { URL, fileURLToPath } from 'node:url';

import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

const appName = 'TTG Club';

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
    typescriptBundlerResolution: true,
  },

  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  runtimeConfig: {
    apiSecret: process.env.NUXT_API_SECRET,
    mailVerifySecret: process.env.NUXT_MAIL_VERIFY_SECRET,
    mongoose: {
      uri: process.env.NUXT_MONGOOSE_URI,
    },
    nodemailer: {
      auth: {
        type: 'login',
        user: process.env.NUXT_NODEMAILER_AUTH_USER || '',
        pass: process.env.NUXT_NODEMAILER_AUTH_PASS || '',
      },
      from: process.env.NUXT_NODEMAILER_FROM,
    },
  },

  security: {
    headers: {
      crossOriginEmbedderPolicy:
        process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'require-corp',
      contentSecurityPolicy: false,
      xXSSProtection: '1; mode=block',
    },
  },

  appId: 'ttg-club',

  app: {
    head: {
      charset: 'utf-8',
      link: [
        {
          rel: 'manifest',
          href: '/manifest.json',
          crossorigin: 'anonymous',
        },
        {
          rel: 'preconnect',
          href: 'https://img.ttg.club',
          crossorigin: '',
        },
        {
          rel: 'dns-prefetch',
          href: 'https://img.ttg.club',
          crossorigin: '',
        },
        {
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
        {
          type: 'image/png',
          href: '/favicon.png',
        },
        ...[48, 72, 96, 144, 192, 256, 384, 512].map((size) => ({
          sizes: `${size}x${size}`,
          href: `/icons/${size}.png`,
        })),
      ],
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

  ogImage: {
    enabled: false,
  },

  robots: {
    disallow: ['/user', '/admin', '/auth', '/search', '/profile', '/api'],
  },

  site: {
    url: process.env.NUXT_SERVER_URL,
    name: `${appName} Oнлайн-справочник`,
    description: `${appName} - сайт, посвященный DnD 5-й редакции. Тут можно найти: расы, происхождения, классы, заклинания, бестиарий, снаряжение, магические предметы и инструменты для облегчения игры как игрокам, так и мастерам - все в одном месте.`,
    defaultLocale: 'ru',
    indexable: process.env.NUXT_INDEXABLE === 'true',
  },

  googleFonts: {
    display: 'swap',
    subsets: ['cyrillic', 'cyrillic-ext'],
    families: {
      Lora: true,
      Neucha: true,
      OpenSans: true,
    },
  },

  dayjs: {
    locales: ['ru', 'en'],
    plugins: ['utc', 'localizedFormat', 'customParseFormat'],
    defaultLocale: 'ru',
  },

  antd: {
    icons: false,
    extractStyle: true,
  },

  nodemailer: {
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    from: process.env.NUXT_NODEMAILER_FROM,
    tls: {
      rejectUnauthorized: false,
    },
    auth: {
      type: 'login',
      user: process.env.NUXT_NODEMAILER_AUTH_USER || '',
      pass: process.env.NUXT_NODEMAILER_AUTH_PASS || '',
    },
  },

  mongoose: {
    uri: process.env.NUXT_MONGOOSE_URI,
  },

  typescript: {
    typeCheck: true,
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  nitro: {
    preset: 'node-cluster',
    routeRules: {
      '/proxy/**': {
        proxy: `${process.env.NUXT_API_URL}/**`,
        cors: true,
        headers: {
          token: process.env.NUXT_API_TOKEN,
        },
      },
    },
    experimental: {
      openAPI: true,
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "~/assets/styles/variables" as *;`,
        },
      },
    },
    plugins: [
      createSvgIconsPlugin({
        iconDirs: [
          fileURLToPath(new URL('./app/assets/icons', import.meta.url)),
        ],
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
    ],
  },

  modules: [
    '@nuxtjs/google-fonts',
    '@nuxtjs/device',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/device',
    '@nuxtjs/seo',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@ant-design-vue/nuxt',
    '@pinia/nuxt',
    'nuxt-mongoose',
    'nuxt-nodemailer',
    'nuxt-typed-router',
    'nuxt-security',
    'dayjs-nuxt',
  ],
});
