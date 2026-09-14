import type { HomeHeroSettings } from '#shared/types';

import { homeHeroSettingsSchema } from '#shared/utils';

import { HOME_HERO_API_URL, HOME_HERO_DATA_KEY } from '../model';

/**
 * Загрузка настройки фона шапки с проверкой ответа схемой.
 *
 * @returns настройка фона
 */
async function fetchHomeHeroSettings(): Promise<HomeHeroSettings> {
  return homeHeroSettingsSchema.parse(await $fetch(HOME_HERO_API_URL));
}

/**
 * Свой фон шапки главной — картинка или видео из админки. Грузится ещё на
 * сервере, поэтому шапка сразу рисуется со своим фоном, без подмены карты после
 * гидратации. Пока ответа нет или запрос упал, фона нет — остаётся карта.
 *
 * @returns фон шапки (`null` — карта по умолчанию) и перезагрузка настройки
 */
export function useHomeHeroSettings() {
  const { data, refresh } = useAsyncData(
    HOME_HERO_DATA_KEY,
    fetchHomeHeroSettings,
  );

  const media = computed(() => data.value?.media ?? null);

  return { media, refresh };
}
