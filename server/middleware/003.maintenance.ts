import {
  getMaintenanceSiteSettings,
  isMaintenancePageRequest,
  resolveMaintenanceGate,
} from '#server/domain/maintenance';
import { getOnlineSiteId } from '#server/domain/online';
import { MAINTENANCE_CONTEXT_KEY } from '#shared/consts';

/**
 * Режим «сайт закрыт на обновление». Решает на сервере, до рендера, показать
 * ли вместо страницы заглушку: её получают все, кроме администраторов и ролей,
 * отмеченных в настройке (роли из токена; сессию к этому моменту уже продлил `001.validateAuthToken`). Решение
 * кладётся в контекст запроса — по нему рендер рисует заглушку, а плагин
 * `maintenanceResponse` ставит ответу статус и заголовки.
 *
 * API, сборку и служебные роуты режим не трогает — иначе не заработали бы ни
 * вход, ни сайт у администратора.
 */
export default defineEventHandler(async (event) => {
  if (!isMaintenancePageRequest(event)) {
    return;
  }

  const settings = await getMaintenanceSiteSettings(getOnlineSiteId());

  if (!settings.enabled) {
    return;
  }

  event.context[MAINTENANCE_CONTEXT_KEY] = await resolveMaintenanceGate(
    event,
    settings,
  );
});
