// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath, URL } from 'node:url';
import bytes from 'bytes';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

const appName = 'TTG Club';

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
    typescriptBundlerResolution: true,
  },

  devtools: {
    enabled: true,
  },

  devServer: {
    https: process.env.NUXT_DEV_SSL === 'true',
  },

  runtimeConfig: {
    api: {
      url: process.env.NUXT_API_URL,
      token: process.env.NUXT_API_TOKEN,
      secret: process.env.NUXT_API_SECRET,
    },
    s3: {
      endpoint: process.env.NUXT_S3_ENDPOINT,
      region: process.env.NUXT_S3_REGION,
      bucket: process.env.NUXT_S3_BUCKET,
      accessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY,
    },
    site: {
      url: process.env.NUXT_SITE_URL,
      name: `${appName} Oнлайн-справочник`,
      description: `${appName} — сайт, посвященный DnD 5-й редакции. Тут можно найти: расы, происхождения, классы, заклинания, бестиарий, снаряжение, магические предметы и инструменты для облегчения игры как игрокам, так и мастерам — все в одном месте.`,
      defaultLocale: 'ru',
      indexable: process.env.NUXT_SITE_INDEXABLE === 'true',
    },
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': false,
        'media-src': false,
      },
      xXSSProtection: '1; mode=block',
    },

    requestSizeLimiter: {
      maxUploadFileRequestInBytes: bytes('30MB') || 8000000,
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
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png',
        },
        ...[48, 72, 96, 144, 192, 256, 384, 512].map((size) => ({
          sizes: `${size}x${size}`,
          href: `/icons/${size}.png`,
        })),
      ],
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
    disallow: [
      '/user',
      '/admin',
      '/auth',
      '/search',
      '/profile',
      '/api',
      '/auth',
    ],
  },

  fonts: {
    defaults: {
      subsets: ['cyrillic-ext', 'cyrillic'],
    },
    providers: {
      adobe: false,
      bunny: false,
      local: false,
    },
    priority: ['google', 'fontshare', 'fontsource'],
    families: [{ name: 'Open Sans' }],
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
    '@nuxt/fonts',
    '@nuxtjs/device',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/device',
    '@nuxtjs/seo',
    '@nuxt/image',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@ant-design-vue/nuxt',
    '@pinia/nuxt',
    'nuxt-security',
    'dayjs-nuxt',
  ],

  compatibilityDate: '2024-11-15',
});
