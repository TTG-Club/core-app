import type { HomeHeroSettings } from '#shared/types';

import { resetHomeHeroMedia } from '#server/domain/home-hero';
import { assertAdminRole } from '#server/utils/getUser';

/** Возвращает шапке главной карту по умолчанию: свой фон и его файл удаляются. */
export default defineEventHandler(async (event): Promise<HomeHeroSettings> => {
  await assertAdminRole(event);

  return resetHomeHeroMedia();
});
