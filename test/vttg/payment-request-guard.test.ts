import type { H3Event } from 'h3';

import { describe, expect, it } from 'vitest';

import { isPaymentCreateRequest } from '#server/domain/subscription-sales/service/paymentRequestGuard';

function createEvent(method: string, path: string): H3Event {
  return { method, path } as H3Event;
}

describe('isPaymentCreateRequest', () => {
  it.each([
    '/api/subscriptions/payments',
    '/api/subscriptions/payments?x=1',
    '/api/subscriptions/payments/',
    '//api//subscriptions///payments//',
    '/api/subscriptions/%70ayments',
    '/api/subscriptions/payments;jsessionid=1',
    '/API/Subscriptions/Payments',
    '/api/subscriptions/%E0%A4%A',
  ])('ловит создание платежа по пути %s', (path) => {
    expect(isPaymentCreateRequest(createEvent('POST', path))).toBe(true);
  });

  it.each([
    ['POST', '/api/subscriptions/payments/payanyway'],
    ['GET', '/api/subscriptions/payments/payanyway'],
    ['GET', '/api/subscriptions/payments/terms'],
    ['GET', '/api/subscriptions/payments'],
    ['POST', '/api/subscriptions/redeem'],
    ['POST', '/api/subscriptions/codes'],
  ])('пропускает %s %s', (method, path) => {
    expect(isPaymentCreateRequest(createEvent(method, path))).toBe(false);
  });
});
