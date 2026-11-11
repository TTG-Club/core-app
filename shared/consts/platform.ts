/**
 * Платформы-источники в микросервисах TTG (баг-репорты, комментарии). Набор общий
 * для всех сервисов: пользователь один и тот же, платформы те же, и расхождение в
 * названиях заставило бы сопоставлять их руками в каждой админке.
 */
export const SOURCE_PLATFORMS = ['SITE_5E24', 'SITE_5E14', 'VTTG'] as const;

export type SourcePlatform = (typeof SOURCE_PLATFORMS)[number];

/**
 * Платформа этого сайта. Лежит в `shared`, а не в фиче: идентичность сайта —
 * общее знание, и её нельзя разнести по двум константам, которые обязаны
 * совпадать. Значение уходит и в баг-репорты, и в ключ обсуждения комментариев.
 */
export const SOURCE_PLATFORM: SourcePlatform = 'SITE_5E24';

/**
 * Платформа сайта другой редакции (D&D 2014). Его страницы открываются по базе
 * из `runtimeConfig.public.oldSiteUrl` — например, переход к своему комментарию,
 * оставленному там.
 */
export const OLD_SITE_SOURCE_PLATFORM: SourcePlatform = 'SITE_5E14';

/** Русские названия платформ — для админок баг-репортов и комментариев. */
export const SOURCE_PLATFORM_LABELS: Record<SourcePlatform, string> = {
  SITE_5E24: 'Сайт 2024',
  SITE_5E14: 'Сайт 2014',
  VTTG: 'VTTG',
};
