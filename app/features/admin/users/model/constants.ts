import type {
  AdminSubscriptionStatus,
  AdminSubscriptionType,
  AdminUserDetailTab,
} from './types';

/** Маршрут раздела управления пользователями в админ-панели. */
export const ADMIN_USERS_ROUTE = '/admin/users';

export const ADMIN_USERS_PAGE_TITLE = 'Пользователи';

export const ADMIN_USERS_NAVIGATION_LABEL = 'Пользователи';

export const ADMIN_USERS_NAVIGATION_ICON = 'tabler:user-cog';

export const ADMIN_USERS_PAGE_DESCRIPTION =
  'Поиск пользователей по имени или email и управление назначенными ролями.';

export const ADMIN_USERS_SEARCH_PLACEHOLDER = 'Имя пользователя или email';

export const ADMIN_USERS_SEARCH_DEBOUNCE = 300;

/** Размер страницы списка пользователей. */
export const ADMIN_USERS_DEFAULT_PAGE_SIZE = 20;

/** Подписи счётчика пользователей в панели управления. */
export const ADMIN_USERS_TOTAL_LABEL = 'Всего пользователей';
export const ADMIN_USERS_FOUND_LABEL = 'Найдено';

export const ADMIN_USERS_EMPTY_TEXT = 'Пользователи не найдены';

/** Значение и подпись пункта «все роли» для фильтра списка. */
export const ADMIN_USERS_ROLE_FILTER_ALL = 'all';
export const ADMIN_USERS_ROLE_FILTER_ALL_LABEL = 'Все роли';

/** Подпись, когда у пользователя не назначено ни одной роли. */
export const ADMIN_USERS_NO_ROLES_LABEL = 'Без ролей';

/** Пустое состояние детальной панели (пользователь не выбран). */
export const ADMIN_USERS_DETAIL_EMPTY_ICON = 'tabler:user-search';
export const ADMIN_USERS_DETAIL_EMPTY_TITLE = 'Пользователь не выбран';
export const ADMIN_USERS_DETAIL_EMPTY_TEXT =
  'Выберите пользователя из списка слева, чтобы просмотреть профиль и управлять ролями и подпиской.';

/** Вкладки детальной панели пользователя. */
export const ADMIN_USERS_DETAIL_TABS: Array<{
  label: string;
  value: AdminUserDetailTab;
  slot: AdminUserDetailTab;
}> = [
  { label: 'Основное', value: 'main', slot: 'main' },
  { label: 'Подписка', value: 'subscription', slot: 'subscription' },
  { label: 'Комментарии', value: 'comments', slot: 'comments' },
];

/** Вкладка детальной панели, открытая при выборе пользователя. */
export const ADMIN_USERS_DETAIL_DEFAULT_TAB: AdminUserDetailTab = 'main';

/** Заголовок секции ролей в детальной панели. */
export const ADMIN_USERS_ROLES_SECTION_TITLE = 'Роли';

/** Не удалось загрузить список пользователей. */
export const ADMIN_USERS_LOAD_ERROR_TEXT = 'Не удалось загрузить пользователей';

/** Формат даты регистрации/обновления в профиле пользователя. */
export const ADMIN_USERS_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

export const ADMIN_USERS_ROLE_FIELD_LABEL = 'Роли';

export const ADMIN_USERS_ROLE_PLACEHOLDER = 'Выбери роли';

export const ADMIN_USERS_SAVE_LABEL = 'Сохранить';

export const ADMIN_USERS_CONFIGURE_LABEL = 'Настроить';

export const ADMIN_USERS_SAVED_TOAST = 'Роли пользователя обновлены';

export const ADMIN_USERS_SAVE_ERROR_TOAST = 'Не удалось обновить роли';

export const ADMIN_USERS_ACTIVE_BADGE = 'Активен';

export const ADMIN_USERS_LOCKED_BADGE = 'Заблокирован';

export const ADMIN_USERS_EMAIL_VERIFIED_BADGE = 'Email подтверждён';

export const ADMIN_USERS_EMAIL_NOT_VERIFIED_BADGE = 'Email не подтверждён';

export const ADMIN_USERS_CREDENTIALS_EXPIRED_BADGE = 'Пароль устарел';

/** Заголовок секции блокировки в детальной панели. */
export const ADMIN_USERS_BAN_SECTION_TITLE = 'Блокировка';

/** Подписи кнопок блокировки/разблокировки. */
export const ADMIN_USERS_BAN_LABEL = 'Заблокировать';
export const ADMIN_USERS_UNBAN_LABEL = 'Разблокировать';

/** Заголовки и описания диалога подтверждения. */
export const ADMIN_USERS_BAN_DIALOG_TITLE = 'Заблокировать пользователя?';
export const ADMIN_USERS_BAN_DIALOG_DESCRIPTION =
  'Аккаунт перейдёт в статус BANNED, все сессии будут отозваны, вход станет невозможен.';
export const ADMIN_USERS_UNBAN_DIALOG_TITLE = 'Разблокировать пользователя?';
export const ADMIN_USERS_UNBAN_DIALOG_DESCRIPTION =
  'Пользователь снова сможет входить в аккаунт.';

/** Поле причины блокировки (уходит в statusReason auth-service). */
export const ADMIN_USERS_BAN_REASON_LABEL = 'Причина блокировки';
export const ADMIN_USERS_BAN_REASON_PLACEHOLDER =
  'Например: спам в комментариях';
export const ADMIN_USERS_BAN_REASON_MAX_LENGTH = 500;

/** Переключатель «забанить вместе с комментариями». */
export const ADMIN_USERS_BAN_HIDE_COMMENTS_LABEL =
  'Скрыть все комментарии пользователя';
export const ADMIN_USERS_BAN_HIDE_COMMENTS_DESCRIPTION =
  'Опубликованные комментарии пропадут с сайта. Их можно вернуть при разблокировке.';

/** Переключатель «разблокировать вместе с комментариями». */
export const ADMIN_USERS_UNBAN_RESTORE_COMMENTS_LABEL =
  'Восстановить комментарии';
export const ADMIN_USERS_UNBAN_RESTORE_COMMENTS_DESCRIPTION =
  'Вернуть комментарии, скрытые при блокировке. Удалённые вручную не вернутся.';

/** Тосты результатов блокировки/разблокировки. */
export const ADMIN_USERS_BANNED_TOAST = 'Пользователь заблокирован';
export const ADMIN_USERS_UNBANNED_TOAST = 'Пользователь разблокирован';
export const ADMIN_USERS_BAN_ERROR_TOAST =
  'Не удалось заблокировать пользователя';
export const ADMIN_USERS_UNBAN_ERROR_TOAST =
  'Не удалось разблокировать пользователя';
export const ADMIN_USERS_HIDE_COMMENTS_ERROR_TOAST =
  'Пользователь заблокирован, но скрыть комментарии не удалось';
export const ADMIN_USERS_RESTORE_COMMENTS_ERROR_TOAST =
  'Пользователь разблокирован, но восстановить комментарии не удалось';

/** Подпись кнопки отмены в диалоге блокировки. */
export const ADMIN_USERS_BAN_CANCEL_LABEL = 'Отмена';

/** Подписи текущего состояния блокировки в карточке. */
export const ADMIN_USERS_BAN_PERMANENT_LABEL = 'Бессрочно';
export const ADMIN_USERS_BANNED_UNTIL_PREFIX = 'До';
export const ADMIN_USERS_BAN_REASON_TITLE = 'Причина';

/**
 * Возвращает описание тоста со счётчиком скрытых комментариев.
 */
export function getHiddenCommentsToastDescription(affected: number): string {
  return `Скрыто комментариев: ${affected}`;
}

/**
 * Возвращает описание тоста со счётчиком восстановленных комментариев.
 */
export function getRestoredCommentsToastDescription(affected: number): string {
  return `Восстановлено комментариев: ${affected}`;
}

/**
 * Возвращает путь server-роута блокировки пользователя.
 */
export function adminUserLockPath(userId: string): string {
  return `/api/auth/users/${encodeURIComponent(userId)}/lock`;
}

/**
 * Возвращает путь server-роута разблокировки пользователя.
 */
export function adminUserUnlockPath(userId: string): string {
  return `/api/auth/users/${encodeURIComponent(userId)}/unlock`;
}

/**
 * Возвращает путь server-роута массового скрытия комментариев автора.
 */
export function adminUserCommentsHidePath(userId: string): string {
  return `/api/admin/comments/${encodeURIComponent(userId)}/hide`;
}

/**
 * Возвращает путь server-роута восстановления комментариев автора.
 */
export function adminUserCommentsRestorePath(userId: string): string {
  return `/api/admin/comments/${encodeURIComponent(userId)}/restore`;
}

/** Формат даты периода подписки в карточке (без времени). */
export const ADMIN_SUBSCRIPTION_DATE_FORMAT = 'DD.MM.YYYY';

/** Заголовок блока подписки в карточке пользователя. */
export const ADMIN_SUBSCRIPTION_SECTION_TITLE = 'Подписка';

/** Подписи статуса подписки. */
export const ADMIN_SUBSCRIPTION_STATUS_LABELS: Record<
  AdminSubscriptionStatus,
  string
> = {
  CREATED: 'Создана',
  REGISTERED: 'Не активирована',
  ACTIVE: 'Активна',
  EXPIRED: 'Истекла',
};

/** Цвета бейджа статуса подписки. */
export const ADMIN_SUBSCRIPTION_STATUS_COLORS: Record<
  AdminSubscriptionStatus,
  'neutral' | 'warning' | 'success' | 'error'
> = {
  CREATED: 'neutral',
  REGISTERED: 'warning',
  ACTIVE: 'success',
  EXPIRED: 'error',
};

/** Подписи типа подписки. */
export const ADMIN_SUBSCRIPTION_TYPE_LABELS: Record<
  AdminSubscriptionType,
  string
> = {
  GIFT: 'Подарочная',
  BUY: 'Купленная',
};

/** Ограничения поля «на сколько месяцев выдать». */
export const ADMIN_SUBSCRIPTION_GRANT_MONTHS_MIN = 1;
export const ADMIN_SUBSCRIPTION_GRANT_MONTHS_MAX = 120;
export const ADMIN_SUBSCRIPTION_GRANT_MONTHS_DEFAULT = 1;

/**
 * Возвращает путь server-роута статуса/отзыва подписки пользователя.
 */
export function adminSubscriptionPath(username: string): string {
  return `/api/admin/subscriptions/${encodeURIComponent(username)}`;
}

/**
 * Возвращает путь server-роута выдачи месяцев подписки пользователю.
 */
export function adminSubscriptionGrantPath(username: string): string {
  return `${adminSubscriptionPath(username)}/grant`;
}

/**
 * Возвращает путь server-роута с промокодами, погашёнными пользователем.
 */
export function adminSubscriptionCodesPath(username: string): string {
  return `${adminSubscriptionPath(username)}/codes`;
}
