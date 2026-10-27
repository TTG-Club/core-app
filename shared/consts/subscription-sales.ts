/**
 * Включена ли оплата подписки — ручка subscriber-service (через прокси сайта),
 * открыта без входа. Её читает кнопка покупки.
 */
export const SUBSCRIPTION_SALES_API_PATH =
  '/api/subscriptions/payments/availability';

/** Роут админки, которым включают и выключают оплату подписки. */
export const SUBSCRIPTION_SALES_ADMIN_API_PATH =
  '/api/admin/subscription-sales';
