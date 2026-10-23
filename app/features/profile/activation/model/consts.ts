import type { ButtonProps } from '@nuxt/ui';

import type {
  RewardPerk,
  RewardTier,
  Subscription,
  SubscriptionStatus,
  SubscriptionType,
} from './types';

import { maxBy } from 'es-toolkit';
import ms from 'ms';

import { VTTG_SUBSCRIPTION_LINK } from '~vttg/model';

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

/**
 * Готовые S3-загрузки наград — фолбэк, пока бэкенд не проставил `url` в
 * reward_resource. Ключ отдаётся прокси core-app `/s3/<key>`. Если админ позже
 * задаст url на бэке — приоритет у бэкенда (см. RewardLinkRow).
 */
export const REWARD_PERK_FALLBACK_URLS: Partial<Record<RewardPerk, string>> = {
  MAP_TOKENS_DOWNLOAD: '/s3/vttgw/rewards/CardsAndTokens.zip',
};

/**
 * Изображение рамки аватара (косметический перк AVATAR_FRAME) — накладывается
 * поверх аватара в сайдбаре профиля, если перк выдан кодом. Ключ отдаётся прокси
 * core-app `/s3/<key>` (как остальные S3-ассеты).
 */
export const AVATAR_FRAME_IMAGE_URL = '/s3/vttgw/rewards/frame.webp';

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

/**
 * Точечные переопределения кнопки действия по перку. Для чата разработки url —
 * одноразовое Telegram-приглашение, закреплённое за кодом на бэке, поэтому кнопка
 * зовёт присоединиться, а не «Открыть».
 */
const REWARD_PERK_ACTION_OVERRIDES: Partial<
  Record<RewardPerk, { label: string; icon: string }>
> = {
  DEV_CHAT_ACCESS: { label: 'Присоединиться', icon: 'ttg:telegram' },
};

/** Подпись действия по перку: скачать (загрузки) или открыть (доступы/прочее). */
export function rewardActionLabel(perk: RewardPerk): string {
  return (
    REWARD_PERK_ACTION_OVERRIDES[perk]?.label
    ?? (DOWNLOAD_PERKS.has(perk) ? 'Скачать' : 'Открыть')
  );
}

/** Иконка кнопки действия по перку. */
export function rewardActionIcon(perk: RewardPerk): string {
  return (
    REWARD_PERK_ACTION_OVERRIDES[perk]?.icon
    ?? (DOWNLOAD_PERKS.has(perk) ? 'tabler:download' : 'tabler:external-link')
  );
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

/**
 * Кнопка на странице подписки из карточки статуса. Ввод промокода — на этой же
 * странице ниже, поэтому карточка ведёт не к нему, а к оформлению подписки.
 */
export const SUBSCRIPTION_STATUS_SUBSCRIBE_BUTTON = VTTG_SUBSCRIPTION_LINK;

/** Статус действующей подписки. */
export const SUBSCRIPTION_ACTIVE_STATUS: SubscriptionStatus = 'ACTIVE';

/**
 * Есть ли среди подписок пользователя действующая.
 *
 * @param subscriptions подписки пользователя.
 * @returns true — хотя бы одна подписка активна.
 */
export function hasActiveSubscription(
  subscriptions: ReadonlyArray<Subscription>,
): boolean {
  return subscriptions.some(
    (subscription) => subscription.status === SUBSCRIPTION_ACTIVE_STATUS,
  );
}

/** За сколько дней до окончания подписки сайт предупреждает о нём. */
export const SUBSCRIPTION_EXPIRY_WARNING_DAYS = 7;

/** Длительность суток для подсчёта оставшихся дней подписки. */
const SUBSCRIPTION_DAY_MS = ms('1d');

/** Как часто пересчитывается остаток дней на открытой вкладке. */
export const SUBSCRIPTION_EXPIRY_CLOCK_INTERVAL = ms('1h');

/** Формы слова «день» для предупреждения об окончании подписки. */
const SUBSCRIPTION_DAY_PLURAL_FORMS: [string, string, string] = [
  'день',
  'дня',
  'дней',
];

/** Плашка о скором окончании подписки: тексты и иконка. */
export const SUBSCRIPTION_EXPIRY_NOTICE = {
  title: 'Подписка скоро закончится',
  icon: 'tabler:hourglass',
  endPrefix: 'Действует до',
  daysLeftPrefix: 'осталось',
  renewHint: 'Продлите её, чтобы не потерять привилегии.',
};

/**
 * Ключ браузерного хранилища: когда пользователь скрыл напоминание — дата
 * окончания и день закрытия. Скрытое напоминание возвращается на следующий
 * день, пока подписка не продлена или не закончилась.
 */
export const SUBSCRIPTION_EXPIRY_DISMISSED_STORAGE_KEY =
  'subscription:expiry-dismissed';

/** Формат дня закрытия напоминания: сутки по часам пользователя. */
export const SUBSCRIPTION_EXPIRY_DISMISS_DAY_FORMAT = 'YYYY-MM-DD';

/** Разделитель даты окончания и дня закрытия в отметке о закрытии. */
const SUBSCRIPTION_EXPIRY_DISMISS_SEPARATOR = '|';

/** Кнопка продления в плашке: ведёт на страницу оформления подписки. */
export const SUBSCRIPTION_EXPIRY_ACTIONS: Array<ButtonProps> = [
  {
    label: 'Продлить',
    icon: VTTG_SUBSCRIPTION_LINK.icon,
    to: VTTG_SUBSCRIPTION_LINK.to,
    color: 'warning',
    variant: 'solid',
  },
];

/** Подписка, срок которой подходит к концу. */
export interface ExpiringSubscription {
  /** Дата окончания из ответа сервиса. */
  expiresAt: string;
  /** Сколько суток осталось, с округлением вверх: последние часы — «1 день». */
  daysLeft: number;
}

/**
 * Подписка, которая скоро закончится. Берётся самая поздняя дата окончания
 * среди действующих: если пользователь уже продлил подписку, предупреждать
 * не о чем.
 *
 * @param subscriptions подписки пользователя.
 * @param now текущий момент в миллисекундах.
 * @returns срок и остаток дней; `undefined` — действующей подписки нет или до
 * окончания дальше порога предупреждения.
 */
export function getExpiringSubscription(
  subscriptions: ReadonlyArray<Subscription>,
  now: number,
): ExpiringSubscription | undefined {
  const activeEnds = subscriptions
    .filter(
      (subscription) => subscription.status === SUBSCRIPTION_ACTIVE_STATUS,
    )
    .map((subscription) => subscription.expiresAt)
    .filter((expiresAt) => expiresAt !== null);

  const latestEnd = maxBy(activeEnds, (expiresAt) => Date.parse(expiresAt));

  if (latestEnd === undefined) {
    return undefined;
  }

  const endTime = Date.parse(latestEnd);

  const warningStart =
    endTime - SUBSCRIPTION_EXPIRY_WARNING_DAYS * SUBSCRIPTION_DAY_MS;

  if (endTime <= now || now < warningStart) {
    return undefined;
  }

  return {
    expiresAt: latestEnd,
    daysLeft: Math.ceil((endTime - now) / SUBSCRIPTION_DAY_MS),
  };
}

/**
 * Отметка о закрытии напоминания: о каком сроке и в какой день. Совпала с
 * сегодняшней — напоминание скрыто; наступил новый день или срок сменился —
 * показывается снова.
 *
 * @param expiresAt дата окончания подписки.
 * @param dismissDay день закрытия в формате `SUBSCRIPTION_EXPIRY_DISMISS_DAY_FORMAT`.
 * @returns отметка для браузерного хранилища.
 */
export function getSubscriptionExpiryDismissMark(
  expiresAt: string,
  dismissDay: string,
): string {
  return `${expiresAt}${SUBSCRIPTION_EXPIRY_DISMISS_SEPARATOR}${dismissDay}`;
}

/**
 * Текст плашки: «Действует до 26.10.2026 — осталось 3 дня. Продлите её, чтобы
 * не потерять привилегии.»
 *
 * @param formattedEnd дата окончания, уже отформатированная для показа.
 * @param daysLeft сколько дней осталось.
 * @returns текст плашки.
 */
export function formatSubscriptionExpiryDescription(
  formattedEnd: string,
  daysLeft: number,
): string {
  const daysWord = getPlural(daysLeft, SUBSCRIPTION_DAY_PLURAL_FORMS);

  return `${SUBSCRIPTION_EXPIRY_NOTICE.endPrefix} ${formattedEnd} — ${SUBSCRIPTION_EXPIRY_NOTICE.daysLeftPrefix} ${daysLeft} ${daysWord}. ${SUBSCRIPTION_EXPIRY_NOTICE.renewHint}`;
}
