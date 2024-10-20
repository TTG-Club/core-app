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
    apiSecret: import.meta.env.API_SECRET,
    mailVerifySecret: import.meta.env.MAIL_VERIFY_SECRET,
    mongodbUri: import.meta.env.MONGODB_URI,
    session: {
      name: 'ttg-user-token',
      password: import.meta.env.API_SECRET,
      cookie: {
        sameSite: 'strict',
      },
    },
  },

  security: {
    enabled: false,
    // headers: {
    //   crossOriginEmbedderPolicy:
    //     import.meta.env.NODE_ENV === 'development'
    //       ? 'unsafe-none'
    //       : 'require-corp',
    //   contentSecurityPolicy: false,
    //   xXSSProtection: '1; mode=block',
    // },
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
        {
          sizes: '192x192',
          href: '/icons/192.png',
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

  robots: {
    disallow: ['/user', '/admin', '/auth', '/search', '/profile', '/api'],
  },

  site: {
    url: import.meta.env.SERVER_URL,
    name: `${appName} Oнлайн-справочник`,
    description: `${appName} - сайт, посвященный DnD 5-й редакции. Тут можно найти: расы, происхождения, классы, заклинания, бестиарий, снаряжение, магические предметы и инструменты для облегчения игры как игрокам, так и мастерам - все в одном месте.`,
    defaultLocale: 'ru',
    indexable: false, // TODO: Вернуть на релизе для прода
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
    host: import.meta.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      type: 'login',
      user: import.meta.env.MAIL_USER,
      pass: import.meta.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    from: `"TTG Support" <${import.meta.env.MAIL_USER}>`,
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
    routeRules: {
      '/proxy/**': {
        proxy: `${import.meta.env.API_URL}/**`,
        cors: true,
        headers: {
          token: import.meta.env.API_TOKEN,
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
    '@nuxtjs/sitemap',
    '@nuxtjs/device',
    '@nuxtjs/robots',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/seo',
    '@nuxtjs/device',
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
