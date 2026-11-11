/**
 * Общий контракт обложек из роликов ВК: адреса и ответы, которые знают и
 * страницы сайта, и серверные роуты. Каждый редактор подключает свой ВК, и
 * кадр ролика берётся его ключом прямо при правке записи.
 */

/** Подключение ВК текущего редактора: состояние (GET) и отключение (DELETE). */
export const VK_VIDEO_ADMIN_API_PATH = '/api/admin/vk';

/** Начало входа через VK ID. */
export const VK_VIDEO_ADMIN_LOGIN_API_PATH = `${VK_VIDEO_ADMIN_API_PATH}/login`;

/** Адрес возврата из VK ID — он же внесён в настройки приложения ВК. */
export const VK_VIDEO_ADMIN_CALLBACK_API_PATH = `${VK_VIDEO_ADMIN_API_PATH}/callback`;

/** Кадр ролика ВК → обложка записи. */
export const VK_VIDEO_ADMIN_COVER_API_PATH = `${VK_VIDEO_ADMIN_API_PATH}/cover`;

/** Страница подключения в админке (в неё же возвращается окно входа). */
export const VK_VIDEO_ADMIN_ROUTE = '/admin/vk-video';

/** Параметр адреса страницы подключения, которым сервер сообщает итог входа. */
export const VK_VIDEO_CONNECT_RESULT_QUERY = 'vk';

/** Параметр адреса с причиной неудачного входа. */
export const VK_VIDEO_CONNECT_REASON_QUERY = 'reason';

/** Итоги входа через VK ID в параметре адреса. */
export const VK_VIDEO_CONNECT_RESULT = {
  connected: 'connected',
  error: 'error',
} as const;

/** Ответ, когда редактор ещё не подключил свой ВК. */
export const VK_VIDEO_COVER_NOT_CONNECTED_MESSAGE =
  'Подключите свой ВК, чтобы брать обложки из роликов';

/** Ответ, когда у ролика не нашлось кадра. */
export const VK_VIDEO_COVER_NO_IMAGE_MESSAGE =
  'ВК не отдал кадр ролика: ролик удалён, закрыт или недоступен вашему аккаунту';
