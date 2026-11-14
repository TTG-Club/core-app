import { fetchSubscriberAdminService } from '#server/utils/subscriberAdminService';

/** Ручка журнала массовых продлений в subscriber-service. */
const SUBSCRIBER_EXTEND_ALL_PATH = '/api/admin/subscriptions/extend-all';

/**
 * Возвращает журнал массовых продлений подписки (новые сверху). Только для
 * администратора.
 */
export default defineEventHandler(
  async (event) =>
    await fetchSubscriberAdminService<unknown>(
      event,
      SUBSCRIBER_EXTEND_ALL_PATH,
    ),
);
