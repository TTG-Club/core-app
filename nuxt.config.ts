// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath, URL } from 'node:url';

import bytes from 'bytes';
import ms from 'ms';

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
    light: '#fdfaf9',
    dark: '#0d1a22',
    svifty7: '#1f1f22',
  },
};

export default defineNuxtConfig({
  // Общие настройки проекта
  future: {
    compatibilityVersion: 4,
    typescriptBundlerResolution: true,
  },
  compatibilityDate: '2024-11-15',

  // Конфигурация среды разработки
  devServer: {
    https: process.env.NUXT_DEV_SSL === 'true',
  },

  // Модули и зависимости
  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxtjs/device',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/seo',
    '@nuxt/image',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    'nuxt-security',
  ],

  // Конфигурация приложения
  appId: 'ttg-club',
  app: {
    head: {
      charset: 'utf-8',
      titleTemplate: '%s %separator %siteName',
      viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
      meta: [
        {
          name: 'mobile-web-app-capable',
          content: 'yes',
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'default',
        },
      ],
    },
    rootAttrs: {
      id: 'ttg-club',
      class: 'ttg-club',
    },
  },

  // SEO и метаданные
  seo: {
    redirectToCanonicalSiteUrl: true,
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

  // Безопасность
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

  // Стили и UI
  css: ['~/assets/css/tailwind.css'],
  ui: {
    colorMode: false,
  },
  icon: {
    serverBundle: {
      collections: ['lucide', 'fluent'],
    },
    customCollections: [
      {
        prefix: 'ttg',
        dir: fileURLToPath(new URL('./app/assets/icons', import.meta.url)),
      },
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
      fontshare: false,
    },
    priority: ['google', 'fontsource'],
    families: [{ name: 'Open Sans' }],
  },

  // TypeScript и линтеры
  typescript: {
    typeCheck: true,
  },
  eslint: {
    config: {
      standalone: false,
    },
  },

  // Роутинг и сервер
  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
    routeRules: {
      '/api/**': {
        security: {
          enabled: process.env.NODE_ENV !== 'development',
          rateLimiter: {
            tokensPerInterval: 50,
            interval: ms('1m'),
            headers: true,
          },
        },
      },
      '/s3/**': {
        security: {
          enabled: process.env.NODE_ENV !== 'development',
          rateLimiter: {
            tokensPerInterval: 50,
            interval: ms('1m'),
            headers: true,
          },
        },
      },
    },
  },

  // Сборщик и пути
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "~/assets/css/variables" as *;`,
        },
      },
    },
  },
  alias: {
    '~ui': fileURLToPath(new URL('./app/shared/ui', import.meta.url)),
    '~tw': fileURLToPath(
      new URL('./app/assets/css/tailwind.css', import.meta.url),
    ),
  },

  // Конфигурация runtime
  runtimeConfig: {
    public: {
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
});
