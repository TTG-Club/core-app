import { useOnlineHeartbeat } from '~infrastructure/analytics/composables';

/** Подключает учёт посетителей онлайн с учётом согласия на статистику. */
export default defineNuxtPlugin(() => {
  useOnlineHeartbeat();
});
