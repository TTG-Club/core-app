import type { HomeHeroSettings } from '#shared/types';

/** Настройка без своего фона — в шапке карта по умолчанию. */
export const HOME_HERO_EMPTY_SETTINGS: HomeHeroSettings = { media: null };

/** Раздел хранилища, куда ложатся файлы фона шапки главной. */
export const HOME_HERO_UPLOAD_SECTION = 'home-hero';

/** Метка ошибок роутов фона шапки в логе. */
export const HOME_HERO_ERROR_LOG = '[Home Hero Error]:';

/** Файл настройки не разбирается как JSON. */
export const HOME_HERO_SETTINGS_INVALID_JSON_LOG =
  '[Home Hero] Settings file is not a valid JSON:';

/** JSON настройки не совпал со схемой. */
export const HOME_HERO_SETTINGS_INVALID_FORMAT_LOG =
  '[Home Hero] Settings file has unexpected format';

/** Прежний файл фона не удалился из хранилища. */
export const HOME_HERO_MEDIA_REMOVE_FAILED_LOG =
  '[Home Hero] Failed to remove media file:';
