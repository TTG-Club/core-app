import type {
  Subscription,
  SubscriptionStatus,
} from '~profile/activation/model';

import ms from 'ms';
import { describe, expect, it } from 'vitest';

import {
  formatSubscriptionExpiryDescription,
  getExpiringSubscription,
  getSubscriptionExpiryDismissMark,
  hasActiveSubscription,
  SUBSCRIPTION_ACTIVE_STATUS,
  SUBSCRIPTION_EXPIRY_WARNING_DAYS,
} from '~profile/activation/model';

const REGISTERED_STATUS: SubscriptionStatus = 'REGISTERED';
const EXPIRED_STATUS: SubscriptionStatus = 'EXPIRED';
const SUBSCRIPTION_CREATED_AT = '2026-10-01T10:00:00Z';
const NOW = Date.parse('2026-10-23T12:00:00Z');
const DAY_MS = ms('1d');
const HOUR_MS = ms('1h');
const FORMATTED_END = '26.10.2026';
const EXPIRING_DAYS_LEFT = 3;
const TODAY = '2026-10-23';
const TOMORROW = '2026-10-24';
const RENEWED_DAYS_LEFT = 30;

/**
 * Момент на заданное расстояние от «сейчас» строкой ISO.
 *
 * @param offsetMs смещение в миллисекундах.
 * @returns дата строкой ISO.
 */
function createDateFromNow(offsetMs: number): string {
  return new Date(NOW + offsetMs).toISOString();
}

/**
 * Подписка с заданным статусом; остальные поля для проверки не важны.
 *
 * @param status статус подписки.
 * @param expiresAt дата окончания.
 * @returns подписка для проверки.
 */
function createSubscription(
  status: SubscriptionStatus,
  expiresAt: string | null = null,
): Subscription {
  return {
    id: `subscription-${status}-${expiresAt}`,
    type: 'GIFT',
    status,
    durationMonths: 1,
    ownerUsername: null,
    registeredAt: null,
    startsAt: null,
    expiresAt,
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

describe('подписка на исходе', () => {
  it('предупреждает за три дня до окончания', () => {
    const expiresAt = createDateFromNow(EXPIRING_DAYS_LEFT * DAY_MS);

    expect(
      getExpiringSubscription(
        [createSubscription(SUBSCRIPTION_ACTIVE_STATUS, expiresAt)],
        NOW,
      ),
    ).toEqual({ expiresAt, daysLeft: EXPIRING_DAYS_LEFT });
  });

  it('последние часы считает одним днём', () => {
    expect(
      getExpiringSubscription(
        [
          createSubscription(
            SUBSCRIPTION_ACTIVE_STATUS,
            createDateFromNow(HOUR_MS),
          ),
        ],
        NOW,
      )?.daysLeft,
    ).toBe(1);
  });

  it('молчит, пока до окончания дальше порога', () => {
    expect(
      getExpiringSubscription(
        [
          createSubscription(
            SUBSCRIPTION_ACTIVE_STATUS,
            createDateFromNow((SUBSCRIPTION_EXPIRY_WARNING_DAYS + 1) * DAY_MS),
          ),
        ],
        NOW,
      ),
    ).toBeUndefined();
  });

  it('берёт самую позднюю дату: продлённую подписку не тревожит', () => {
    expect(
      getExpiringSubscription(
        [
          createSubscription(
            SUBSCRIPTION_ACTIVE_STATUS,
            createDateFromNow(DAY_MS),
          ),
          createSubscription(
            SUBSCRIPTION_ACTIVE_STATUS,
            createDateFromNow(RENEWED_DAYS_LEFT * DAY_MS),
          ),
        ],
        NOW,
      ),
    ).toBeUndefined();
  });

  it('не смотрит на истёкшие и неактивированные', () => {
    expect(
      getExpiringSubscription(
        [
          createSubscription(EXPIRED_STATUS, createDateFromNow(-DAY_MS)),
          createSubscription(REGISTERED_STATUS, createDateFromNow(2 * DAY_MS)),
        ],
        NOW,
      ),
    ).toBeUndefined();
  });

  it('собирает текст с правильной формой слова', () => {
    expect(formatSubscriptionExpiryDescription(FORMATTED_END, 1)).toBe(
      'Действует до 26.10.2026 — осталось 1 день. Продлите её, чтобы не потерять привилегии.',
    );

    expect(
      formatSubscriptionExpiryDescription(FORMATTED_END, EXPIRING_DAYS_LEFT),
    ).toBe(
      'Действует до 26.10.2026 — осталось 3 дня. Продлите её, чтобы не потерять привилегии.',
    );
  });

  it('отметка о закрытии меняется со сменой дня и срока', () => {
    const expiresAt = createDateFromNow(DAY_MS);

    expect(getSubscriptionExpiryDismissMark(expiresAt, TODAY)).not.toBe(
      getSubscriptionExpiryDismissMark(expiresAt, TOMORROW),
    );

    expect(getSubscriptionExpiryDismissMark(expiresAt, TODAY)).not.toBe(
      getSubscriptionExpiryDismissMark(createDateFromNow(2 * DAY_MS), TODAY),
    );
  });
});
