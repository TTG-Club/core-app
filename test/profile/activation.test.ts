import type {
  Subscription,
  SubscriptionStatus,
} from '~profile/activation/model';

import { describe, expect, it } from 'vitest';

import {
  hasActiveSubscription,
  SUBSCRIPTION_ACTIVE_STATUS,
} from '~profile/activation/model';

const REGISTERED_STATUS: SubscriptionStatus = 'REGISTERED';
const EXPIRED_STATUS: SubscriptionStatus = 'EXPIRED';
const SUBSCRIPTION_CREATED_AT = '2026-10-01T10:00:00Z';

/**
 * Подписка с заданным статусом; остальные поля для проверки не важны.
 *
 * @param status статус подписки.
 * @returns подписка для проверки.
 */
function createSubscription(status: SubscriptionStatus): Subscription {
  return {
    id: `subscription-${status}`,
    type: 'GIFT',
    status,
    durationMonths: 1,
    ownerUsername: null,
    registeredAt: null,
    startsAt: null,
    expiresAt: null,
    createdAt: SUBSCRIPTION_CREATED_AT,
    updatedAt: null,
  };
}

describe('действующая подписка', () => {
  it('находит активную среди прочих', () => {
    expect(
      hasActiveSubscription([
        createSubscription(EXPIRED_STATUS),
        createSubscription(SUBSCRIPTION_ACTIVE_STATUS),
      ]),
    ).toBe(true);
  });

  it('не считает действующими зарегистрированную и истёкшую', () => {
    expect(
      hasActiveSubscription([
        createSubscription(REGISTERED_STATUS),
        createSubscription(EXPIRED_STATUS),
      ]),
    ).toBe(false);
  });

  it('без подписок — нет действующей', () => {
    expect(hasActiveSubscription([])).toBe(false);
  });
});
