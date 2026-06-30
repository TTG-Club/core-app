import type { AdminSubscriptionStatus, AdminSubscriptionType } from './types';

export const ADMIN_USERS_PAGE_TITLE = 'Пользователи: управление';

export const ADMIN_USERS_NAVIGATION_LABEL = 'Пользователи';

export const ADMIN_USERS_NAVIGATION_ICON = 'tabler:user-cog';

export const ADMIN_USERS_PAGE_DESCRIPTION =
  'Поиск пользователей по имени или email и управление назначенными ролями.';

export const ADMIN_USERS_SEARCH_PLACEHOLDER = 'Имя пользователя или email';

export const ADMIN_USERS_SEARCH_DEBOUNCE = 300;

export const ADMIN_USERS_EMPTY_TEXT = 'Пользователи не найдены';

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
