import type { SubscriptionType } from '~/shared/types';

import type {
  PaymentFilterOption,
  PaymentFilterValue,
  PaymentStatus,
} from './types';

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
