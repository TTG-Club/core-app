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
    light: 'oklch(0.98 0.02 80.0)',
    dark: 'oklch(0.245 0.02 270.0)',
    svifty7: 'oklch(0.30 0.006 75.0)',
  },
};

export default defineNuxtConfig({
  // Общие настройки проекта
  future: {
    typescriptBundlerResolution: true,
  },

  compatibilityDate: '2025-07-22',

  // Конфигурация среды разработки
  devServer: {
    https: process.env.NUXT_DEV_SSL === 'true',
  },

  // Модули и зависимости
  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxtjs/device',
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
      viewport:
        'width=device-width, initial-scale=1.0, maximum-scale=1, viewport-fit=cover',
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
    rateLimiter: false,
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
        recursive: true,
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

  image: {
    provider: 'none',
  },

  // TypeScript и линтеры
  typescript: {
    typeCheck: 'build', // Проверка типов только при сборке, не блокирует dev
    tsConfig: {
      compilerOptions: {
        verbatimModuleSyntax: true, // Быстрее обработка модулей
      },
    },
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

  // Nitro
  nitro: {
    experimental: {
      openAPI: true,
    },

    // Минификация для уменьшения размера
    minify: true,

    // Компрессия статики
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },

    routeRules: {
      '/api/**': {
        security: {
          enabled: process.env.NODE_ENV !== 'development',
          rateLimiter: {
            tokensPerInterval: 75,
            interval: ms('1m'),
            headers: true,
          },
        },
      },
      '/s3/**': {
        security: {
          enabled: process.env.NODE_ENV !== 'development',
          rateLimiter: {
            tokensPerInterval: 75,
            interval: ms('1m'),
            headers: true,
          },
        },
      },
    },
  },

  // Sourcemaps
  sourcemap: {
    server: false, // Не нужны на сервере
    client: 'hidden', // Генерируются, но не включаются в бандл
  },

  // Сборщик и пути
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "~/assets/css/variables" as *;`,
        },
      },
    },

    build: {
      minify: 'esbuild',
      cssCodeSplit: false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
    },

    optimizeDeps: {
      include: [
        // Vue Core
        'vue',
        '@vue/devtools-core',
        '@vue/devtools-kit',

        // Nuxt UI
        '@nuxt/ui/locale',

        // Утилиты
        'es-toolkit',
        '@vueuse/core',
        '@nuxtjs/device',

        // Date/Time
        'dayjs',
        'dayjs/locale/ru',
        'dayjs/plugin/advancedFormat',
        'dayjs/plugin/customParseFormat',
        'dayjs/plugin/localizedFormat',
        'dayjs/plugin/timezone',
        'dayjs/plugin/utc',

        // HTTP/API
        'http-status-codes',

        // Dev tools
        '@faker-js/faker',
        'transliteration',

        // LightGallery
        'lightgallery/vue',
        'lightgallery/plugins/thumbnail',
        'lightgallery/plugins/zoom',
        'lightgallery/plugins/fullscreen',

        // Tables
        '@tanstack/vue-table',

        // Pinia
        'pinia',
        '@pinia/nuxt',
      ],
    },
  },

  alias: {
    '~ui': fileURLToPath(new URL('./app/shared/ui', import.meta.url)),
  },

  // Конфигурация runtime
  runtimeConfig: {
    public: {
      pwa: application,
      lightGallery: {
        licenseKey:
          process.env.NUXT_LIGHT_GALLERY_LICENSE_KEY || '0000-0000-000-0000',
      },
    },
    site: {
      url: process.env.NUXT_SITE_URL,
      name: application.name.long,
      description: application.description,
      defaultLocale: 'ru',
      indexable: false,
    },
  },
});
