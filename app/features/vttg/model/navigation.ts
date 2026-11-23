/**
 * Адреса и подписи раздела для навигации сайта.
 *
 * Лежат отдельно от остальных констант раздела: меню сайта стоит на каждой
 * странице, и вместе с адресом в стартовый скрипт попадал бы весь файл, из
 * которого он взят. Меню импортирует этот файл напрямую, а не barrel модели.
 */

/** Путь страницы инструкции — на него ведёт ссылка из окна входа VTTG. */
export const VTTG_PASSWORD_RESET_PATH = '/vttg/reset-password';

/** Путь лендинга VTTG — кнопка «назад» на странице инструкции. */
export const VTTG_LANDING_PATH = '/vttg';

/** Заголовок и подзаголовок страницы; заголовок — он же пункт меню. */
export const VTTG_PASSWORD_RESET_PAGE = {
  title: 'Сброс мастер-пароля',
  subtitle: 'Virtual TTG Club',
} as const;

/** Адрес страницы подписки. */
export const VTTG_SUBSCRIPTION_PATH = '/subscription';

/** Подпись пункта меню. */
export const VTTG_SUBSCRIPTION_NAVIGATION_LABEL = 'Подписка';
