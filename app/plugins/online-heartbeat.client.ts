import { useOnlineHeartbeat } from '~infrastructure/analytics/composables';

/** Автоматически подключает учёт посетителей онлайн. */
export default defineNuxtPlugin(() => {
  useOnlineHeartbeat();
});
