/**
 * Адреса и подписи раздела для навигации сайта.
 *
 * Лежат отдельно от остальных констант раздела: меню сайта стоит на каждой
 * странице, и вместе с адресом в стартовый скрипт попадал бы весь файл, из
 * которого он взят. Меню импортирует этот файл напрямую, а не barrel модели.
 */

/** Каталог игр. */
export const GAMES_ROUTE = '/games';

/** Создание игры мастером. */
export const GAMES_CREATE_ROUTE = '/games/create';

/** Свои игры мастера. */
export const GAMES_MY_ROUTE = '/games/my';

/** Профиль поиска игр во вкладках профиля пользователя. */
export const FIND_GAME_PROFILE_ROUTE = '/user/profile/find-game';

/** Раздел, под которым каталог живёт в навигации. */
export const GAMES_NAVIGATION_LABEL = 'Поиск игр';

/** Пункт каталога внутри раздела навигации. */
export const GAMES_CATALOG_NAVIGATION_LABEL = 'Каталог игр';

export const GAMES_CREATE_NAVIGATION_LABEL = 'Создать игру';

export const GAMES_MY_NAVIGATION_LABEL = 'Мои игры';

export const FIND_GAME_PROFILE_NAVIGATION_LABEL = 'Игровой профиль';
