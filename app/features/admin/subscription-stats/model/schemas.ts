import type { AdminPayment, AdminSubscription } from './types';

import * as z from 'zod';

const adminPaymentSchema: z.ZodType<AdminPayment> = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  months: z.number().int(),
  status: z.enum(['CREATED', 'PAID', 'REJECTED']),
  testMode: z.boolean(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
});

const adminSubscriptionSchema: z.ZodType<AdminSubscription> = z.object({
  id: z.string(),
  type: z.enum(['GIFT', 'BUY']),
  status: z.enum(['CREATED', 'REGISTERED', 'ACTIVE', 'EXPIRED']),
  durationMonths: z.number().int(),
  ownerUsername: z.string().nullable(),
  startsAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

/**
 * Проверяет ответ subscriber-service со списком платежей.
 */
export function parseAdminPayments(payload: unknown): AdminPayment[] {
  return z.array(adminPaymentSchema).parse(payload);
}

/**
 * Проверяет ответ subscriber-service со списком всех подписок.
 */
export function parseAdminSubscriptions(payload: unknown): AdminSubscription[] {
  return z.array(adminSubscriptionSchema).parse(payload);
}
