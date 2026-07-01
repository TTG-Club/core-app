import type {
  RewardPerk,
  RewardTier,
  SubscriptionStatus,
  SubscriptionType,
} from './types';

/** Эндпоинты подписок/наград (проксируются как есть). */
export const SUBSCRIPTION_MY_CODES_API_PATH = '/api/subscriptions/my-codes';
export const SUBSCRIPTION_MY_API_PATH = '/api/subscriptions/my';
export const SUBSCRIPTION_REDEEM_API_PATH = '/api/subscriptions/redeem';
/** Перки (постоянные награды) текущего пользователя. */
export const REWARDS_MY_API_PATH = '/api/rewards/me';

/** Ключи useAsyncData данных подписки/наград (один источник для refresh). */
export const SUBSCRIPTION_MY_DATA_KEY = 'subscription-my';
export const SUBSCRIPTION_MY_CODES_DATA_KEY = 'subscription-my-codes';
export const SUBSCRIPTION_MY_REWARDS_DATA_KEY = 'subscription-my-rewards';

/**
 * «Живые» данные фонового опроса — статус подписки и перки (блок статуса вверху
 * профиля и бейдж/значок/цвет ника в сайдбаре). Список кодов сюда НЕ входит: он
 * меняется только при погашении и обновляется точечно (refreshAll), чтобы фоновый
 * опрос не дёргал историю кодов. Обновляются через refresh() своих composable
 * (общий ключ useAsyncData) — см. useSubscriptionAutoRefresh.
 */

/** Интервал авто-обновления статуса подписки без F5 (мс). */
export const SUBSCRIPTION_POLL_INTERVAL_MS = 30_000;

/**
 * Минимальный интервал между любыми двумя обновлениями (мс). Защита от «спама»
 * при частом переключении вкладок/окон (focus/visibility) — как cooldown у
 * online-heartbeat: серия возвратов на вкладку не выдаёт пачку запросов.
 */
export const SUBSCRIPTION_POLL_COOLDOWN_MS = 10_000;

/**
 * Потолок экспоненциального backoff при ответе 429 (слишком много запросов).
 * Пока сервер лимитирует — опрашиваем реже, чтобы не «залипать» в rate-limit.
 */
export const SUBSCRIPTION_POLL_MAX_BACKOFF_MS = 5 * 60_000;

/** Эндпоинт активации подписки (запуск таймера REGISTERED→ACTIVE). */
export function subscriptionActivatePath(id: string): string {
  return `/api/subscriptions/${id}/activate`;
}

/** Формат дат в разделе (без времени). */
export const REDEMPTION_DATE_FORMAT = 'DD.MM.YYYY';

/** Подписи перков — фолбэк, когда у награды нет server-title из reward_resource. */
export const REWARD_PERK_LABELS: Record<RewardPerk, string> = {
  EARLY_ACCESS_DOWNLOAD: 'Ранний доступ к скачиванию',
  MAP_TOKENS_DOWNLOAD: 'Карты и токены',
  ADVENTURE_DOWNLOAD: 'Приключение',
  DEV_CHAT_ACCESS: 'Приватный чат разработки',
  PROFILE_BADGE: 'Значок профиля',
  AVATAR_FRAME: 'Рамка аватара',
  NICKNAME_COLOR: 'Цвет никнейма',
  PROFILE_ICON: 'Иконки профиля',
  APP_CREDITS: 'Упоминание в титрах приложения',
};

/** Иконка перка для строки награды. */
export const REWARD_PERK_ICONS: Record<RewardPerk, string> = {
  EARLY_ACCESS_DOWNLOAD: 'tabler:download',
  MAP_TOKENS_DOWNLOAD: 'tabler:map-2',
  ADVENTURE_DOWNLOAD: 'tabler:book-2',
  DEV_CHAT_ACCESS: 'tabler:message-circle',
  PROFILE_BADGE: 'tabler:rosette',
  AVATAR_FRAME: 'tabler:photo-circle',
  NICKNAME_COLOR: 'tabler:palette',
  PROFILE_ICON: 'tabler:icons',
  APP_CREDITS: 'tabler:award',
};

/** Перки-«загрузки» — для них уместна кнопка «Скачать» (иначе «Открыть»). */
export const DOWNLOAD_PERKS: ReadonlySet<RewardPerk> = new Set<RewardPerk>([
  'EARLY_ACCESS_DOWNLOAD',
  'MAP_TOKENS_DOWNLOAD',
  'ADVENTURE_DOWNLOAD',
]);

/**
 * Косметические/авто-применяемые перки — ссылки для скачивания у них нет по дизайну,
 * они применяются к профилю. Для них показываем «Активно», а не «Ссылка появится позже».
 */
export const COSMETIC_PERKS: ReadonlySet<RewardPerk> = new Set<RewardPerk>([
  'PROFILE_BADGE',
  'AVATAR_FRAME',
  'NICKNAME_COLOR',
  'PROFILE_ICON',
  'APP_CREDITS',
]);

/** Подпись действия по перку: скачать (загрузки) или открыть (доступы/прочее). */
export function rewardActionLabel(perk: RewardPerk): string {
  return DOWNLOAD_PERKS.has(perk) ? 'Скачать' : 'Открыть';
}

/** Иконка кнопки действия по перку. */
export function rewardActionIcon(perk: RewardPerk): string {
  return DOWNLOAD_PERKS.has(perk) ? 'tabler:download' : 'tabler:external-link';
}

export const REWARD_TIER_LABELS: Record<RewardTier, string> = {
  TIER_1: 'Тир 1',
  TIER_2: 'Тир 2',
  TIER_3: 'Тир 3',
  TIER_4: 'Тир 4',
  TIER_5: 'Тир 5',
  TIER_6: 'Тир 6',
};

export const SUBSCRIPTION_TYPE_LABELS: Record<SubscriptionType, string> = {
  GIFT: 'Подарочная',
  BUY: 'Купленная',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  CREATED: 'Создана',
  REGISTERED: 'Не активирована',
  ACTIVE: 'Активна',
  EXPIRED: 'Истекла',
};

export const SUBSCRIPTION_STATUS_COLORS: Record<
  SubscriptionStatus,
  'neutral' | 'warning' | 'success' | 'error'
> = {
  CREATED: 'neutral',
  REGISTERED: 'warning',
  ACTIVE: 'success',
  EXPIRED: 'error',
};

/** UI-конфиг карточек профиля (как в остальных разделах кабинета). */
export const ProfileCardUI = {
  header: 'px-6 py-4',
  body: 'p-6',
} as const;

/**
 * Нормализует код как бэкенд при погашении: убирает не-буквенно-цифровые символы
 * и приводит к верхнему регистру. Нужно для матчинга введённого кода со списком.
 */
export function normalizeCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}
