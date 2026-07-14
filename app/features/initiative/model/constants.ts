import type { ParticipantType, TrackerStatus } from './types';

/** Базовый путь API трекера инициативы (проксируется на core-api). */
export const INITIATIVE_API_PATH = '/api/v2/tools/initiative';

/** Путь поиска существ в бестиарии для автокомплита. */
export const BESTIARY_SEARCH_PATH = '/api/v2/bestiary/search';

/** Публичный путь страницы инструмента. */
export const INITIATIVE_TOOL_ROUTE = '/tools/initiative';

/** Заголовок страницы инструмента. */
export const INITIATIVE_TOOL_TITLE = 'Трекер инициативы';

/**
 * Ключ localStorage для единственного слота анонимного трекера.
 * Формат `domain:key-name` согласно правилам проекта.
 */
export const ANON_SLOT_STORAGE_KEY = 'initiative:anon-slot';

/** Имя HTTP-заголовка с ключом доступа анонимного трекера. */
export const TRACKER_KEY_HEADER = 'X-Tracker-Key';

/**
 * Ключ localStorage с текущими хитами существ по трекерам.
 * На бэке хитов нет — они живут только на устройстве мастера.
 */
export const HIT_POINTS_STORAGE_KEY = 'initiative:hit-points';

/** Максимум трекеров у авторизованного пользователя. */
export const MAX_AUTHORIZED_TRACKERS = 10;

/** Максимум участников-игроков в одном трекере. */
export const MAX_PLAYERS = 50;

/** Максимум участников-существ в одном трекере. */
export const MAX_CREATURES = 100;

/** Имя трекера по умолчанию (совпадает с дефолтом бэка). */
export const DEFAULT_TRACKER_NAME = 'Новый трекер';

/** Максимальная длина имени трекера. */
export const MAX_TRACKER_NAME_LENGTH = 100;

/** Максимальная длина имени участника. */
export const MAX_PARTICIPANT_NAME_LENGTH = 100;

/** Минимальный бонус инициативы участника. */
export const MIN_INITIATIVE_BONUS = -20;

/** Максимальный бонус инициативы участника. */
export const MAX_INITIATIVE_BONUS = 30;

/** Минимальное значение броска d20. */
export const MIN_D20 = 1;

/** Максимальное значение броска d20. */
export const MAX_D20 = 20;

/** Минимальное количество существ в одной пачке добавления. */
export const MIN_CREATURE_BATCH = 1;

/** Количество существ, запрашиваемых для автокомплита. */
export const CREATURE_SEARCH_SIZE = 20;

/** Задержка дебаунса перед запросом автокомплита существ, мс. */
export const CREATURE_SEARCH_DEBOUNCE_MS = 300;

/** Общее сообщение об ошибке, когда бэк не вернул текст. */
export const UNKNOWN_ERROR_MESSAGE = 'Неизвестная ошибка';

/** Иконка участника по типу. */
export const PARTICIPANT_TYPE_ICON: Record<ParticipantType, string> = {
  PLAYER: 'tabler:user',
  CREATURE: 'tabler:paw',
};

/** Подпись типа участника — фолбэк, когда бэк не прислал `typeName`. */
export const PARTICIPANT_TYPE_LABEL: Record<ParticipantType, string> = {
  PLAYER: 'Игрок',
  CREATURE: 'Существо',
};

/** Оформление бейджа статуса трекера. */
export const TRACKER_STATUS_BADGE: Record<
  TrackerStatus,
  { color: 'neutral' | 'success'; icon: string }
> = {
  PREPARING: { color: 'neutral', icon: 'tabler:swords' },
  ACTIVE: { color: 'success', icon: 'tabler:flame' },
};
