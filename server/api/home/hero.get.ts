import type { HomeHeroSettings } from '#shared/types';

import {
  getHomeHeroSettings,
  HOME_HERO_EMPTY_SETTINGS,
  HOME_HERO_ERROR_LOG,
} from '#server/domain/home-hero';

/**
 * Фон шапки главной. Роут публичный: его читает рендер главной у каждого
 * посетителя. Недоступное хранилище не роняет главную — шапка просто остаётся
 * с картой по умолчанию.
 */
export default defineEventHandler(async (): Promise<HomeHeroSettings> => {
  try {
    return await getHomeHeroSettings();
  } catch (error) {
    consola.error(HOME_HERO_ERROR_LOG, error);

    return HOME_HERO_EMPTY_SETTINGS;
  }
});
