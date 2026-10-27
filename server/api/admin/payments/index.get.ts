import { fetchSubscriberAdminService } from '#server/utils/subscriberAdminService';

/** Ручка списка платежей в subscriber-service. */
const SUBSCRIBER_PAYMENTS_ADMIN_PATH = '/api/admin/payments';

/**
 * Отдаёт все платежи за подписку (новые сверху) для статистики покупок.
 * Ответ проверяет страница статистики. Только для администратора.
 */
export default defineEventHandler(
  (event): Promise<unknown> =>
    fetchSubscriberAdminService<unknown>(event, SUBSCRIBER_PAYMENTS_ADMIN_PATH),
);
