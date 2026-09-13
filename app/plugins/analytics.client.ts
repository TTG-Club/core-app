import { useConsentedAnalytics } from '~infrastructure/analytics/composables';

/**
 * Плагин счётчиков статистики: Яндекс.Метрика и Google Analytics подключаются
 * только после согласия посетителя на аналитические cookie.
 */
export default defineNuxtPlugin(() => {
  useConsentedAnalytics();
});
