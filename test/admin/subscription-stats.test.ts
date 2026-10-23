import type {
  AdminPayment,
  AdminSubscription,
} from '~admin/subscription-stats/model';

import { describe, expect, it } from 'vitest';

import {
  filterPayments,
  getAverageCheck,
  getListPage,
  getSubscriptionStatsSummary,
  joinSubscriptionPeriod,
  PAYMENT_FILTER_ALL,
} from '~admin/subscription-stats/model';

const BUYER_USERNAME = 'buyer';

const GIFTED_USERNAME = 'gifted';

const MONTH_PRICE = 110;

const SUBSCRIPTION_MONTHS = 3;

const CREATED_AT = '2026-10-01T00:00:00Z';

/**
 * Собирает подписку с нужными полями поверх активной купленной.
 */
function createSubscription(
  overrides: Partial<AdminSubscription>,
): AdminSubscription {
  return {
    id: crypto.randomUUID(),
    type: 'BUY',
    status: 'ACTIVE',
    durationMonths: SUBSCRIPTION_MONTHS,
    ownerUsername: BUYER_USERNAME,
    startsAt: CREATED_AT,
    expiresAt: '2027-01-01T00:00:00Z',
    createdAt: CREATED_AT,
    ...overrides,
  };
}

/**
 * Собирает платёж с нужными полями поверх оплаченного боевого.
 */
function createPayment(overrides: Partial<AdminPayment>): AdminPayment {
  return {
    id: crypto.randomUUID(),
    username: BUYER_USERNAME,
    email: null,
    amount: MONTH_PRICE * SUBSCRIPTION_MONTHS,
    currency: 'RUB',
    months: SUBSCRIPTION_MONTHS,
    status: 'PAID',
    testMode: false,
    paidAt: CREATED_AT,
    createdAt: CREATED_AT,
    ...overrides,
  };
}

const subscriptions: AdminSubscription[] = [
  createSubscription({}),
  createSubscription({ type: 'GIFT' }),
  createSubscription({ type: 'GIFT', ownerUsername: GIFTED_USERNAME }),
  createSubscription({ status: 'EXPIRED', ownerUsername: GIFTED_USERNAME }),
  createSubscription({ status: 'CREATED', ownerUsername: null }),
];

const payments: AdminPayment[] = [
  createPayment({}),
  createPayment({ months: 1, amount: MONTH_PRICE }),
  createPayment({ testMode: true, username: GIFTED_USERNAME }),
  createPayment({ status: 'CREATED', paidAt: null }),
  createPayment({ status: 'REJECTED', paidAt: null }),
];

describe('getSubscriptionStatsSummary', () => {
  it('считает подписчиков по людям, а подписки — по записям', () => {
    const subscriptionStats = getSubscriptionStatsSummary(subscriptions, []);

    expect(subscriptionStats.activeSubscribers).toBe(2);
    expect(subscriptionStats.activeBought).toBe(1);
    expect(subscriptionStats.activeGifted).toBe(2);
    expect(subscriptionStats.totalSubscriptions).toBe(subscriptions.length);
  });

  it('не берёт в покупки тестовые и неоплаченные платежи', () => {
    const subscriptionStats = getSubscriptionStatsSummary([], payments);

    expect(subscriptionStats.paidPayments).toBe(2);
    expect(subscriptionStats.payingUsers).toBe(1);
    expect(subscriptionStats.paidMonths).toBe(SUBSCRIPTION_MONTHS + 1);
    expect(subscriptionStats.unpaidPayments).toBe(1);

    expect(subscriptionStats.revenue).toBe(
      MONTH_PRICE * (SUBSCRIPTION_MONTHS + 1),
    );
  });
});

describe('getAverageCheck', () => {
  it('делит выручку на число покупок', () => {
    const subscriptionStats = getSubscriptionStatsSummary([], payments);

    expect(getAverageCheck(subscriptionStats)).toBe(MONTH_PRICE * 2);
  });

  it('без покупок не считается', () => {
    const subscriptionStats = getSubscriptionStatsSummary([], []);

    expect(getAverageCheck(subscriptionStats)).toBeUndefined();
  });
});

describe('filterPayments', () => {
  it('оставляет платежи выбранного статуса', () => {
    expect(filterPayments(payments, 'REJECTED')).toHaveLength(1);
  });

  it('отдаёт все платежи без фильтра', () => {
    expect(filterPayments(payments, PAYMENT_FILTER_ALL)).toHaveLength(
      payments.length,
    );
  });
});

describe('joinSubscriptionPeriod', () => {
  it('склеивает начало и конец срока', () => {
    expect(joinSubscriptionPeriod('01.10.2026', '01.01.2027')).toBe(
      '01.10.2026 — 01.01.2027',
    );
  });
});

describe('getListPage', () => {
  const rows = [1, 2, 3, 4, 5];

  it('отдаёт строки нужной страницы', () => {
    expect(getListPage(rows, 2, 2)).toEqual([3, 4]);
  });

  it('на последней странице отдаёт остаток', () => {
    expect(getListPage(rows, 3, 2)).toEqual([5]);
  });

  it('за концом списка отдаёт пустую страницу', () => {
    expect(getListPage(rows, 4, 2)).toEqual([]);
  });
});
