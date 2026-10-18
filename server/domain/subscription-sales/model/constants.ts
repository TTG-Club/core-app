import type { SubscriptionSalesSettings } from '#shared/types';

/**
 * Настройка по умолчанию — оплата включена. Пока в админке оплату не
 * выключали, файла настройки нет, и кнопка покупки доступна всем.
 */
export const SUBSCRIPTION_SALES_DEFAULT_SETTINGS: SubscriptionSalesSettings = {
  enabled: true,
};

/** Метка ошибок роутов настройки продажи подписки в логе. */
export const SUBSCRIPTION_SALES_ERROR_LOG = '[Subscription Sales Error]:';

/** Файл настройки не разбирается как JSON. */
export const SUBSCRIPTION_SALES_INVALID_JSON_LOG =
  '[Subscription Sales] Settings file is not a valid JSON:';

/** JSON настройки не совпал со схемой. */
export const SUBSCRIPTION_SALES_INVALID_FORMAT_LOG =
  '[Subscription Sales] Settings file has unexpected format';
