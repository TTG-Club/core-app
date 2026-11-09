import type { SubscriptionType } from '~/shared/types';

import type {
  PaymentFilterOption,
  PaymentFilterValue,
  PaymentStatus,
} from './types';

import {
  SUBSCRIPTION_EXTENSION_DAYS_MAX,
  SUBSCRIPTION_EXTENSION_DAYS_MIN,
} from '#shared/consts';

export const SUBSCRIPTION_STATS_ROUTE = '/admin/subscription-stats';

export const SUBSCRIPTION_STATS_PAGE_TITLE = 'Подписки и покупки';

export const SUBSCRIPTION_STATS_NAVIGATION_ICON = 'tabler:chart-bar';

/** Все подписки идут через прокси сайта прямо в subscriber-service. */
export const SUBSCRIPTION_STATS_SUBSCRIPTIONS_API_PATH =
  '/api/subscriptions/all';

/** Платежи — через свою ручку сайта (BFF), она проверяет роль ADMIN. */
export const SUBSCRIPTION_STATS_PAYMENTS_API_PATH = '/api/admin/payments';

export const SUBSCRIPTION_STATS_SUBSCRIPTIONS_DATA_KEY =
  'admin-subscription-stats-subscriptions';

export const SUBSCRIPTION_STATS_PAYMENTS_DATA_KEY =
  'admin-subscription-stats-payments';

export const SUBSCRIPTION_STATS_NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');

/** Суммы с разрядами: выручка за всё время бывает пятизначной. */
export const SUBSCRIPTION_STATS_MONEY_FORMAT = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

/** Между началом и концом срока подписки. */
export const SUBSCRIPTION_STATS_PERIOD_SEPARATOR = ' — ';

export const SUBSCRIPTION_STATS_SUMMARY_TITLE = 'Итоги';

export const SUBSCRIPTION_STATS_ACTIVE_LABEL = 'Подписчиков сейчас';

export const SUBSCRIPTION_STATS_ACTIVE_HINT =
  'Пользователи, у которых сейчас идёт подписка (купленная или подарочная).';

export const SUBSCRIPTION_STATS_ACTIVE_BOUGHT_LABEL = 'Купленных';

export const SUBSCRIPTION_STATS_ACTIVE_GIFTED_LABEL = 'Подарочных';

export const SUBSCRIPTION_STATS_TOTAL_LABEL = 'Всего подписок';

export const SUBSCRIPTION_STATS_TOTAL_HINT =
  'Подписки за всё время: активные, истёкшие и ещё не активированные.';

export const SUBSCRIPTION_STATS_PURCHASES_LABEL = 'Покупок';

export const SUBSCRIPTION_STATS_PURCHASES_HINT =
  'Оплаченные платежи за всё время, без тестовых.';

export const SUBSCRIPTION_STATS_PAYING_USERS_LABEL = 'Покупателей';

export const SUBSCRIPTION_STATS_PAID_MONTHS_LABEL = 'Месяцев';

export const SUBSCRIPTION_STATS_UNPAID_LABEL = 'Не оплачено';

export const SUBSCRIPTION_STATS_UNPAID_HINT =
  'Пользователь открыл форму оплаты, но не заплатил.';

export const SUBSCRIPTION_STATS_REVENUE_LABEL = 'Выручка';

export const SUBSCRIPTION_STATS_REVENUE_HINT =
  'Сумма оплаченных платежей за всё время, без тестовых.';

export const SUBSCRIPTION_STATS_AVERAGE_CHECK_LABEL = 'Средний чек';

export const SUBSCRIPTION_STATS_PAYMENTS_TITLE = 'История покупок';

export const SUBSCRIPTION_STATS_SUBSCRIPTIONS_TITLE = 'Все подписки';

export const SUBSCRIPTION_STATS_PAYMENTS_EMPTY_TEXT = 'Покупок пока нет.';

export const SUBSCRIPTION_STATS_SUBSCRIPTIONS_EMPTY_TEXT = 'Подписок пока нет.';

export const SUBSCRIPTION_STATS_PAYMENTS_ERROR_TEXT =
  'Не удалось загрузить покупки.';

export const SUBSCRIPTION_STATS_SUBSCRIPTIONS_ERROR_TEXT =
  'Не удалось загрузить подписки.';

export const SUBSCRIPTION_STATS_TEST_BADGE_LABEL = 'Тест';

export const SUBSCRIPTION_STATS_TEST_BADGE_HINT =
  'Тестовый платёж без списания денег: в итоги не входит.';

export const SUBSCRIPTION_STATS_UNASSIGNED_OWNER_LABEL = 'Не закреплена';

export const SUBSCRIPTION_STATS_LIST_SKELETON_COUNT = 5;

export const PAYMENT_FILTER_ALL = 'ALL';

export const PAYMENT_FILTER_DEFAULT: PaymentFilterValue = 'PAID';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: 'Оплачен',
  CREATED: 'Не оплачен',
  REJECTED: 'Отклонён',
};

export const PAYMENT_STATUS_COLORS: Record<
  PaymentStatus,
  'success' | 'neutral' | 'error'
> = {
  PAID: 'success',
  CREATED: 'neutral',
  REJECTED: 'error',
};

export const PAYMENT_FILTER_OPTIONS: PaymentFilterOption[] = [
  { label: 'Оплаченные', value: 'PAID' },
  { label: 'Не оплаченные', value: 'CREATED' },
  { label: 'Отклонённые', value: 'REJECTED' },
  { label: 'Все', value: PAYMENT_FILTER_ALL },
];

/** Цвета бейджа типа подписки: покупки выделены. */
export const SUBSCRIPTION_TYPE_COLORS: Record<
  SubscriptionType,
  'primary' | 'neutral'
> = {
  BUY: 'primary',
  GIFT: 'neutral',
};

/** Строк на странице в списках покупок и подписок. */
export const SUBSCRIPTION_STATS_LIST_PAGE_SIZE = 15;

/** Плитка подписчиков на главной админки. */
export const SUBSCRIPTION_STATS_DASHBOARD_TILE_TITLE = 'Подписчики';

/** Массовое продление: ручка сайта (BFF), она проверяет роль ADMIN. */
export const BULK_EXTENSION_API_PATH = '/api/admin/subscriptions/extend-all';

export const BULK_EXTENSION_DATA_KEY = 'admin-subscription-bulk-extensions';

export const BULK_EXTENSION_TITLE = 'Продлить всем';

export const BULK_EXTENSION_DESCRIPTION =
  'Добавляет дни всем, у кого подписка идёт прямо сейчас. Истёкшие и ещё не активированные промокоды не меняются.';

export const BULK_EXTENSION_DAYS_LABEL = 'Дней';

export const BULK_EXTENSION_DAYS_MIN = SUBSCRIPTION_EXTENSION_DAYS_MIN;

export const BULK_EXTENSION_DAYS_MAX = SUBSCRIPTION_EXTENSION_DAYS_MAX;

export const BULK_EXTENSION_DAYS_DEFAULT = 1;

export const BULK_EXTENSION_ICON = 'tabler:calendar-plus';

export const BULK_EXTENSION_SUBMIT_LABEL = 'Продлить';

export const BULK_EXTENSION_CONFIRM_TITLE = 'Продлить подписку всем?';

export const BULK_EXTENSION_CONFIRM_LABEL = 'Да, продлить';

export const BULK_EXTENSION_CANCEL_LABEL = 'Отмена';

export const BULK_EXTENSION_CONFIRM_WARNING =
  'Отменить продление нельзя. Повторное нажатие добавит дни ещё раз.';

export const BULK_EXTENSION_SUCCESS_TITLE = 'Подписка продлена';

export const BULK_EXTENSION_ERROR_TITLE = 'Ошибка';

export const BULK_EXTENSION_ERROR_TEXT = 'Не удалось продлить подписку';

export const BULK_EXTENSION_JOURNAL_TITLE = 'Прошлые продления';

export const BULK_EXTENSION_JOURNAL_EMPTY_TEXT =
  'Массовых продлений ещё не было';

export const BULK_EXTENSION_JOURNAL_ERROR_TEXT =
  'Не удалось загрузить прошлые продления';

export const BULK_EXTENSION_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

/** Между частями строки журнала и итога продления. */
export const BULK_EXTENSION_DETAILS_SEPARATOR = ' · ';

/** Знак перед числом добавленных дней. */
export const BULK_EXTENSION_DAYS_PREFIX = '+';

/** Хвост текста подтверждения: «N пользователей получат +M дней …». */
export const BULK_EXTENSION_CONFIRM_VERB = 'получат';

export const BULK_EXTENSION_CONFIRM_SUFFIX = 'к окончанию подписки.';

export const BULK_EXTENSION_DAY_FORMS: [string, string, string] = [
  'день',
  'дня',
  'дней',
];

export const BULK_EXTENSION_USER_FORMS: [string, string, string] = [
  'пользователь',
  'пользователя',
  'пользователей',
];
