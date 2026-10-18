/**
 * Настройка продажи подписки VTTG. `enabled: false` — оплата выключена из
 * админки: кнопка покупки у всех становится «скоро», а сервер не создаёт платежи.
 */
export interface SubscriptionSalesSettings {
  enabled: boolean;
}
