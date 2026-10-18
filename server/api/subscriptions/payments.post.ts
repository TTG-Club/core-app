import { StatusCodes } from 'http-status-codes';

import {
  getSubscriptionSalesSettings,
  SUBSCRIPTION_SALES_ERROR_LOG,
} from '#server/domain/subscription-sales';
import { SUBSCRIPTION_SALES_DISABLED_MESSAGE } from '#shared/consts';

/**
 * Пока оплата выключена в админке, платёж не создаётся — даже если у
 * посетителя открыта старая страница с активной кнопкой. Иначе запрос уходит в
 * subscriber-service как есть. Сбой чтения настройки оплату не блокирует.
 */
async function isSalesEnabled(): Promise<boolean> {
  try {
    return (await getSubscriptionSalesSettings()).enabled;
  } catch (error) {
    consola.error(SUBSCRIPTION_SALES_ERROR_LOG, error);

    return true;
  }
}

export default defineEventHandler(async (event) => {
  if (!(await isSalesEnabled())) {
    throw createError(
      getErrorResponse(StatusCodes.SERVICE_UNAVAILABLE, {
        message: SUBSCRIPTION_SALES_DISABLED_MESSAGE,
      }),
    );
  }

  return proxy(event);
});
