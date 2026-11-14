import type {
  AdminPayment,
  AdminSubscription,
  BulkSubscriptionExtension,
  PaymentFilterValue,
  SubscriptionStatsSummary,
} from './types';

import { compact, sumBy, uniq } from 'es-toolkit';

import {
  BULK_EXTENSION_CONFIRM_SUFFIX,
  BULK_EXTENSION_CONFIRM_VERB,
  BULK_EXTENSION_DAY_FORMS,
  BULK_EXTENSION_DAYS_PREFIX,
  BULK_EXTENSION_DETAILS_SEPARATOR,
  BULK_EXTENSION_USER_FORMS,
  PAYMENT_FILTER_ALL,
  SUBSCRIPTION_STATS_NUMBER_FORMAT,
  SUBSCRIPTION_STATS_PERIOD_SEPARATOR,
} from './constants';

/**
 * Сколько разных пользователей сейчас с подпиской: у одного их может идти несколько.
 */
export function countActiveSubscribers(
  subscriptions: ReadonlyArray<AdminSubscription>,
): number {
  return uniq(
    compact(
      subscriptions
        .filter((subscription) => subscription.status === 'ACTIVE')
        .map((subscription) => subscription.ownerUsername),
    ),
  ).length;
}

/**
 * Считает итоги для плиток: активных подписчиков, покупки и выручку.
 * Тестовые платежи в итоги не входят — деньги по ним не списывались.
 */
export function getSubscriptionStatsSummary(
  subscriptions: ReadonlyArray<AdminSubscription>,
  payments: ReadonlyArray<AdminPayment>,
): SubscriptionStatsSummary {
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === 'ACTIVE',
  );

  const realPayments = payments.filter((payment) => !payment.testMode);

  const paidPayments = realPayments.filter(
    (payment) => payment.status === 'PAID',
  );

  return {
    activeSubscribers: countActiveSubscribers(subscriptions),
    activeBought: activeSubscriptions.filter(
      (subscription) => subscription.type === 'BUY',
    ).length,
    activeGifted: activeSubscriptions.filter(
      (subscription) => subscription.type === 'GIFT',
    ).length,
    totalSubscriptions: subscriptions.length,
    paidPayments: paidPayments.length,
    paidMonths: sumBy(paidPayments, (payment) => payment.months),
    unpaidPayments: realPayments.filter(
      (payment) => payment.status === 'CREATED',
    ).length,
    revenue: sumBy(paidPayments, (payment) => payment.amount),
    payingUsers: uniq(paidPayments.map((payment) => payment.username)).length,
  };
}

/**
 * Средний чек оплаченной покупки. Без покупок не считается — делить не на что.
 */
export function getAverageCheck(
  subscriptionStats: SubscriptionStatsSummary,
): number | undefined {
  return subscriptionStats.paidPayments
    ? subscriptionStats.revenue / subscriptionStats.paidPayments
    : undefined;
}

/**
 * Оставляет платежи с выбранным статусом (или все).
 */
export function filterPayments(
  payments: ReadonlyArray<AdminPayment>,
  paymentFilter: PaymentFilterValue,
): AdminPayment[] {
  return paymentFilter === PAYMENT_FILTER_ALL
    ? [...payments]
    : payments.filter((payment) => payment.status === paymentFilter);
}

/**
 * Срок подписки одной строкой: «01.10.2026 — 01.01.2027».
 */
export function joinSubscriptionPeriod(
  startDateText: string,
  endDateText: string,
): string {
  return `${startDateText}${SUBSCRIPTION_STATS_PERIOD_SEPARATOR}${endDateText}`;
}

/**
 * Отрезает строки одной страницы списка (страницы считаются с 1).
 */
export function getListPage<T>(
  items: ReadonlyArray<T>,
  page: number,
  pageSize: number,
): T[] {
  const start = (page - 1) * pageSize;

  return items.slice(start, start + pageSize);
}

/**
 * Склоняет число дней: «1 день», «3 дня», «20 дней».
 */
export function formatBulkExtensionDays(days: number): string {
  return `${days} ${getPlural(days, BULK_EXTENSION_DAY_FORMS)}`;
}

/**
 * Склоняет число пользователей: «1 пользователь», «5 пользователей».
 */
export function formatBulkExtensionUsers(count: number): string {
  return `${SUBSCRIPTION_STATS_NUMBER_FORMAT.format(count)} ${getPlural(count, BULK_EXTENSION_USER_FORMS)}`;
}

/**
 * Итог продления: «+7 дней · 132 пользователя».
 */
export function formatBulkExtensionSummary(
  extension: Pick<BulkSubscriptionExtension, 'days' | 'extendedCount'>,
): string {
  return [
    `${BULK_EXTENSION_DAYS_PREFIX}${formatBulkExtensionDays(extension.days)}`,
    formatBulkExtensionUsers(extension.extendedCount),
  ].join(BULK_EXTENSION_DETAILS_SEPARATOR);
}

/**
 * Текст подтверждения: «132 пользователя получат +7 дней к окончанию подписки.».
 */
export function getBulkExtensionConfirmText(
  activeSubscribers: number,
  days: number,
): string {
  return [
    formatBulkExtensionUsers(activeSubscribers),
    BULK_EXTENSION_CONFIRM_VERB,
    `${BULK_EXTENSION_DAYS_PREFIX}${formatBulkExtensionDays(days)}`,
    BULK_EXTENSION_CONFIRM_SUFFIX,
  ].join(' ');
}

/**
 * Подробности строки журнала: дата продления и кто его сделал.
 */
export function formatBulkExtensionDetails(
  formattedDate: string,
  actorUsername: string | null,
): string {
  return compact([formattedDate, actorUsername]).join(
    BULK_EXTENSION_DETAILS_SEPARATOR,
  );
}
