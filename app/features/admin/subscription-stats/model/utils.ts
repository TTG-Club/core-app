import type {
  AdminPayment,
  AdminSubscription,
  PaymentFilterValue,
  SubscriptionStatsSummary,
} from './types';

import { compact, sumBy, uniq } from 'es-toolkit';

import {
  PAYMENT_FILTER_ALL,
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
