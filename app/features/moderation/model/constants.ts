/** Корневой маршрут панели модератора */
export const MODERATION_ROUTE = '/moderation';

/** Маршрут раздела баг-репортов в панели модератора */
export const MODERATION_BUGS_ROUTE = `${MODERATION_ROUTE}/bug-reports`;

/** Маршрут раздела модерации комментариев в панели модератора */
export const MODERATION_COMMENTS_ROUTE = `${MODERATION_ROUTE}/comments`;

/** Заголовок панели модератора */
export const MODERATION_PANEL_TITLE = 'Панель модератора';

/** Иконка панели модератора в меню профиля */
export const MODERATION_PANEL_ICON = 'tabler:shield-check';

/** Заголовок плитки баг-репортов на дашборде */
export const MODERATION_DASHBOARD_BUGS_TITLE = 'Баг-репорты';

/** Описание плитки баг-репортов на дашборде */
export const MODERATION_DASHBOARD_BUGS_DESCRIPTION =
  'Сообщения пользователей об ошибках: разбор, статусы и комментарии';

/** Заголовок плитки модерации комментариев на дашборде */
export const MODERATION_DASHBOARD_COMMENTS_TITLE = 'Комментарии';

/** Описание плитки модерации комментариев на дашборде */
export const MODERATION_DASHBOARD_COMMENTS_DESCRIPTION =
  'Жалобы пользователей и модерация всех комментариев сайта';

/** Подпись кнопки перехода в раздел с дашборда */
export const MODERATION_DASHBOARD_OPEN_LABEL = 'Открыть';
