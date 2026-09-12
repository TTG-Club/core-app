import type { HomeHeroMediaKind } from '#shared/types';

import type { HomeHeroPreviewDevice } from './types';

import {
  HOME_HERO_MEDIA_TYPES,
  HOME_HERO_VIDEO_MAX_MEGABYTES,
} from '#shared/consts';

/** Страница настройки фона шапки в админке. */
export const HOME_HERO_ADMIN_ROUTE = '/admin/home-hero';

/** Страница, которую админка открывает во фреймах превью. */
export const HOME_HERO_PREVIEW_ROUTE = '/admin/home-hero/preview';

/** Роут сохранения (`PUT`) и сброса (`DELETE`) фона шапки. */
export const HOME_HERO_ADMIN_API_URL = '/api/admin/home-hero';

/** Параметры адреса страницы превью: ссылка на черновик и его вид. */
export const HOME_HERO_PREVIEW_URL_QUERY = 'url';
export const HOME_HERO_PREVIEW_KIND_QUERY = 'kind';

export const HOME_HERO_ADMIN_PAGE_TITLE = 'Фон шапки главной';

/** Заголовок вкладки браузера — по образцу соседних страниц настроек. */
export const HOME_HERO_ADMIN_SEO_TITLE = `${HOME_HERO_ADMIN_PAGE_TITLE}: Настройки`;

export const HOME_HERO_ADMIN_PAGE_DESCRIPTION =
  'Своя картинка или видео вместо карты в шапке главной';

export const HOME_HERO_ADMIN_NAVIGATION_ICON = 'tabler:photo-edit';

export const HOME_HERO_PREVIEW_PAGE_TITLE = 'Превью шапки главной';

/** Строка `accept` диалога выбора файла. */
export const HOME_HERO_UPLOAD_ACCEPT = HOME_HERO_MEDIA_TYPES.join(', ');

export const HOME_HERO_UPLOAD_LABEL = 'Перетащи файл или нажми, чтобы выбрать';

export const HOME_HERO_UPLOAD_DESCRIPTION = `Картинка .webp, .jpg, .png или видео .webm до ${HOME_HERO_VIDEO_MAX_MEGABYTES} МБ. Лучше от 2560 px в ширину и не шире 2:1: фон растягивается по ширине экрана, а на телефоне шапка выше.`;

export const HOME_HERO_CURRENT_TITLE = 'Сейчас на главной';

export const HOME_HERO_DEFAULT_LABEL = 'Карта по умолчанию';

/** Подписи своего фона по его виду. */
export const HOME_HERO_MEDIA_KIND_LABELS: Record<HomeHeroMediaKind, string> = {
  image: 'Своя картинка',
  video: 'Своё видео',
};

export const HOME_HERO_OPEN_FILE_LABEL = 'Открыть файл';

export const HOME_HERO_PUBLISH_LABEL = 'Опубликовать';

export const HOME_HERO_DISCARD_LABEL = 'Отменить';

export const HOME_HERO_RESET_LABEL = 'Вернуть карту';

export const HOME_HERO_RESET_DIALOG_TITLE = 'Вернуть карту по умолчанию?';

export const HOME_HERO_RESET_DIALOG_DESCRIPTION =
  'Своя картинка или видео удалится из хранилища, в шапке главной снова будет карта.';

export const HOME_HERO_PREVIEW_TITLE = 'Превью';

export const HOME_HERO_PREVIEW_DRAFT_HINT =
  'Черновик: на сайте его ещё нет — проверь и опубликуй.';

export const HOME_HERO_PREVIEW_CURRENT_HINT = 'Так шапка выглядит сейчас.';

export const HOME_HERO_PUBLISH_SUCCESS_MESSAGE = 'Фон шапки обновлён';

export const HOME_HERO_PUBLISH_ERROR_TITLE = 'Не удалось сохранить фон';

export const HOME_HERO_RESET_SUCCESS_MESSAGE = 'В шапке снова карта';

export const HOME_HERO_RESET_ERROR_TITLE = 'Не удалось вернуть карту';

export const HOME_HERO_INVALID_FILE_TITLE = 'Этот файл не подойдёт';

/**
 * Главный экран превью — крупно во всю колонку. Шапка во фрейме рендерится в
 * настоящую ширину экрана — так срабатывают те же брейкпоинты, что у
 * посетителя, — и уменьшается под колонку.
 */
export const HOME_HERO_PREVIEW_PRIMARY_DEVICE: HomeHeroPreviewDevice = {
  id: 'full-hd',
  label: 'Full HD',
  width: 1920,
  height: 1080,
};

/** Остальные экраны превью — рядом, помельче. */
export const HOME_HERO_PREVIEW_SECONDARY_DEVICES: HomeHeroPreviewDevice[] = [
  { id: 'qhd', label: '2K', width: 2560, height: 1440 },
  { id: 'laptop', label: 'Ноутбук', width: 1366, height: 768 },
  { id: 'phone', label: 'Телефон', width: 390, height: 844 },
];
