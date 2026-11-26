/** Типы сообщений протокола y-websocket. */
export const PLAN_SYNC_MESSAGE = {
  sync: 0,
  awareness: 1,
} as const;

/** Сколько держать документ после ухода последнего участника. */
export const PLAN_SYNC_ROOM_GRACE_MS = 60_000;

/** Предел одного сообщения: план целиком с запасом. */
export const PLAN_SYNC_MAX_MESSAGE_BYTES = 4 * 1024 * 1024;

/** Сколько участников может быть в одной комнате. */
export const PLAN_SYNC_MAX_PEERS_PER_ROOM = 32;

/** Сколько комнат сервер держит одновременно. */
export const PLAN_SYNC_MAX_ROOMS = 500;

/** Коды закрытия веб-сокета. */
export const PLAN_SYNC_CLOSE_CODES = {
  policyViolation: 1008,
  tryAgainLater: 1013,
} as const;

/** Префикс токена в заголовке `authorization`. */
export const BEARER_PREFIX = 'Bearer ';

/** Бастионы игроков в core-api. */
export const PLAYER_BASTIONS_API_PATH = '/api/v2/player-bastions';

/** Хвост пути плана бастиона в core-api. */
export const PLAYER_BASTION_PLAN_PATH_SUFFIX = '/plan';
