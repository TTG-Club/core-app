import ms from 'ms';

/** Ручка версии компендиума в core-api — одинаковая у обоих каналов. */
export const VTTG_COMPENDIUM_VERSION_PATH =
  '/api/v2/vttg/admin/compendium-version';

/** Таймаут запроса к core-api канала: ответ крошечный, пересборка идёт в фоне. */
export const VTTG_COMPENDIUM_REQUEST_TIMEOUT = ms('15s');

/** Метка серверного лога версии компендиума. */
export const VTTG_COMPENDIUM_LOG_CONTEXT = '[vttg-compendium]';

/** Ответ, когда core-api канала не ответил или ответил без понятной причины. */
export const VTTG_COMPENDIUM_UNAVAILABLE_MESSAGE =
  'Сервер канала компендиума не ответил';
