/** Публичный роут настройки продажи подписки — его читает кнопка покупки. */
export const SUBSCRIPTION_SALES_API_PATH = '/api/vttg/subscription-sales';

/** Роут админки, которым включают и выключают оплату подписки. */
export const SUBSCRIPTION_SALES_ADMIN_API_PATH =
  '/api/admin/subscription-sales';

/** Ответ на попытку оплатить, пока оплата выключена в админке. */
export const SUBSCRIPTION_SALES_DISABLED_MESSAGE =
  'Оплата подписки временно недоступна. Попробуйте позже.';
