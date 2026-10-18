/**
 * Состояние оплаты подписки VTTG из subscriber-service. `enabled: false` —
 * оплата выключена из админки: кнопка покупки у всех становится «скоро», а
 * subscriber-service не создаёт платежи.
 */
export interface SubscriptionSalesSettings {
  enabled: boolean;
}
