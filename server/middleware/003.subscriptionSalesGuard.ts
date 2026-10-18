import { StatusCodes } from 'http-status-codes';

import {
  getSubscriptionSalesSettings,
  isPaymentCreateRequest,
  SUBSCRIPTION_SALES_ERROR_LOG,
} from '#server/domain/subscription-sales';
import { SUBSCRIPTION_SALES_DISABLED_MESSAGE } from '#shared/consts';

/**
 * Пока оплата выключена в админке, сайт не пропускает в subscriber-service
 * создание платежа — даже если у посетителя открыта старая страница с
 * активной кнопкой или запрос отправлен вручную. Проверка стоит в middleware,
 * а не в отдельном роуте: так её не обойти другим написанием пути. Сбой чтения
 * настройки оплату не блокирует.
 */
export default defineEventHandler(async (event) => {
  if (!isPaymentCreateRequest(event)) {
    return;
  }

  let isSalesEnabled = true;

  try {
    isSalesEnabled = (await getSubscriptionSalesSettings()).enabled;
  } catch (error) {
    consola.error(SUBSCRIPTION_SALES_ERROR_LOG, error);
  }

  if (!isSalesEnabled) {
    throw createError(
      getErrorResponse(StatusCodes.SERVICE_UNAVAILABLE, {
        message: SUBSCRIPTION_SALES_DISABLED_MESSAGE,
      }),
    );
  }
});
