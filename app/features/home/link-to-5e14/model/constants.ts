/**
 * Карточка-ссылка на сайт предыдущей редакции D&D. Адрес не здесь: он берётся
 * из `runtimeConfig.public.oldSiteUrl`, чтобы dev вёл на dev, а прод — на прод.
 */
export const LEGACY_SITE = {
  eyebrow: 'Другая редакция',
  title: 'D&D 2014',
  description: 'Предыдущая редакция Dungeons & Dragons',
} as const;
