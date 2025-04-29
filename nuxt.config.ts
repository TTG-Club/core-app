// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath, URL } from 'node:url';

import bytes from 'bytes';
import ms from 'ms';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

const application = {
  name: {
    short: 'TTG',
    base: 'TTG Club',
    long: 'TTG Club Oнлайн-справочник',
  },
  description:
    'TTG Club — сайт, посвященный DnD 5-й редакции. Тут можно найти: расы, происхождения, классы, заклинания, бестиарий, снаряжение, магические предметы и инструменты для облегчения игры как игрокам, так и мастерам — все в одном месте.',
  favicons: [48, 72, 96, 128, 192, 384, 512],
  themeColor: {
    light: '#131A20',
    dark: '#131A21',
    svifty7: '#131A22',
  },
};

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
    app: {
      pwa: application,
    },
    site: {
      url: '',
      name: application.name.long,
      description: application.description,
      defaultLocale: 'ru',
      indexable: false,
    },
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'https:', 'data:'],
        'media-src': ["'self'", 'https:', 'data:'],
      },
      strictTransportSecurity: {
        preload: true,
        maxAge: 31536000,
        includeSubdomains: true,
      },
      xContentTypeOptions: 'nosniff',
      xXSSProtection: '1; mode=block',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        geolocation: [],
        microphone: [],
        camera: [],
        fullscreen: ['self'],
      },
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
          rel: 'preconnect',
          href: 'https://img.ttg.club',
        },
        {
          rel: 'dns-prefetch',
          href: 'https://img.ttg.club',
        },
        // {
        //   rel: 'icon',
        //   type: 'image/svg+xml',
        //   href: '/favicons/favicon.svg',
        // },
        // {
        //   rel: 'apple-touch-icon',
        //   href: '/favicons/apple-touch-icon.png',
        // },
        // ...application.favicons.map((size) => ({
        //   rel: 'icon',
        //   type: 'image/png',
        //   sizes: `${size}x${size}`,
        //   href: `/favicons/${size}x${size}.png`,
        // })),
      ],
      titleTemplate: '%s %separator %siteName',
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
    // fallbackTitle: false,
    automaticOgAndTwitterTags: true,
    automaticDefaults: true,
    canonicalLowercase: true,
  },

  unhead: {
    renderSSRHeadOptions: {
      omitLineBreaks: true,
    },
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
      '/workshop/*',
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

  antd: {
    icons: false,
    extractStyle: true,
  },

  typescript: {
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        typeRoots: [
          fileURLToPath(new URL('./app/shared/types/global', import.meta.url)),
        ],
      },
    },
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

    // TODO: Поиграть с лимитами в будущем, если не будет хватать
    routeRules: {
      '/api/**': {
        security: {
          enabled: true,
          rateLimiter: {
            tokensPerInterval: 50,
            interval: ms('1m'),
            headers: true,
          },
        },
      },
      '/s3/**': {
        security: {
          enabled: true,
          rateLimiter: {
            tokensPerInterval: 50,
            interval: ms('1m'),
            headers: true,
          },
        },
      },
    },
  },

  alias: {
    '~ui': fileURLToPath(new URL('./app/shared/ui', import.meta.url)),
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
    '@nuxtjs/seo',
    '@nuxt/image',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@ant-design-vue/nuxt',
    '@pinia/nuxt',
    'nuxt-security',
  ],

  compatibilityDate: '2024-11-15',
});
