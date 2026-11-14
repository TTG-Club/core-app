import { MAINTENANCE_CONTEXT_KEY } from '#shared/consts';
import { maintenanceGateSchema } from '#shared/utils';
import { useMaintenanceGate } from '~infrastructure/maintenance/composables';

/**
 * Переносит решение о заглушке режима обновления из серверного middleware
 * (`003.maintenance`) в состояние приложения — по нему `app.vue` рисует
 * заглушку вместо страницы. Нет решения в контексте — режим выключен или это
 * не страница.
 */
export default defineNuxtPlugin(() => {
  const { setGate } = useMaintenanceGate();

  const serverGate = maintenanceGateSchema.safeParse(
    useRequestEvent()?.context[MAINTENANCE_CONTEXT_KEY],
  );

  if (serverGate.success) {
    setGate(serverGate.data);
  }
});
