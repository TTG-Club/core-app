import type {
  CodeStatus,
  CreateCodesFormState,
  CreateCodesRequest,
  RedemptionCodeResponse,
  RewardPerk,
  RewardTier,
  SubscriptionType,
} from './types';

/** Эндпоинт кодов: POST — выпуск пачки, GET — список (проксируется как есть). */
export const SUBSCRIPTION_CODES_API_PATH = '/api/subscriptions/codes';

/** Эндпоинт деактивации кода (после неё код нельзя погасить). */
export function subscriptionCodeDeactivatePath(id: string): string {
  return `${SUBSCRIPTION_CODES_API_PATH}/${id}/deactivate`;
}

/** Эндпоинт возврата деактивированного кода в активные. */
export function subscriptionCodeReactivatePath(id: string): string {
  return `${SUBSCRIPTION_CODES_API_PATH}/${id}/reactivate`;
}

/** Формат даты в списке кодов (без времени). */
export const CODE_LIST_DATE_FORMAT = 'DD.MM.YYYY';

/** Формат даты со временем в детали кода. */
export const CODE_DETAIL_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

/** Ограничения пачки (зеркалят валидацию бэкенда). */
export const CODES_BATCH_MIN = 1;
export const CODES_BATCH_MAX = 1000;

/** Разумный предел срока подписки в форме (бэкенд требует лишь >= 1). */
export const SUBSCRIPTION_MONTHS_MIN = 1;
export const SUBSCRIPTION_MONTHS_MAX = 60;

/** Порядок тиров по возрастанию (= порядок объявления на бэкенде). */
export const REWARD_TIERS: readonly RewardTier[] = [
  'TIER_1',
  'TIER_2',
  'TIER_3',
  'TIER_4',
  'TIER_5',
  'TIER_6',
] as const;

export const SUBSCRIPTION_TYPES: readonly SubscriptionType[] = [
  'GIFT',
  'BUY',
] as const;

export const REWARD_PERKS: readonly RewardPerk[] = [
  'EARLY_ACCESS_DOWNLOAD',
  'MAP_TOKENS_DOWNLOAD',
  'ADVENTURE_DOWNLOAD',
  'DEV_CHAT_ACCESS',
  'PROFILE_BADGE',
  'AVATAR_FRAME',
  'NICKNAME_COLOR',
  'PROFILE_ICON',
  'APP_CREDITS',
] as const;

export const SUBSCRIPTION_TYPE_LABELS: Record<SubscriptionType, string> = {
  GIFT: 'Подарочная',
  BUY: 'Купленная',
};

export const REWARD_TIER_LABELS: Record<RewardTier, string> = {
  TIER_1: 'Тир 1',
  TIER_2: 'Тир 2',
  TIER_3: 'Тир 3',
  TIER_4: 'Тир 4',
  TIER_5: 'Тир 5',
  TIER_6: 'Тир 6',
};

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

/** Собственные перки каждого тира (без накопления). */
const TIER_OWN_PERKS: Record<RewardTier, RewardPerk[]> = {
  TIER_1: ['EARLY_ACCESS_DOWNLOAD'],
  TIER_2: ['MAP_TOKENS_DOWNLOAD'],
  TIER_3: ['ADVENTURE_DOWNLOAD'],
  TIER_4: ['DEV_CHAT_ACCESS'],
  TIER_5: ['PROFILE_BADGE', 'AVATAR_FRAME'],
  TIER_6: ['APP_CREDITS'],
};

/**
 * Кумулятивный набор перков тира: данного и всех нижестоящих.
 * Повторяет RewardTier.perks() с бэкенда — для подсказки в форме.
 */
export function tierCumulativePerks(tier: RewardTier): RewardPerk[] {
  const result: RewardPerk[] = [];

  for (const current of REWARD_TIERS) {
    result.push(...TIER_OWN_PERKS[current]);

    if (current === tier) {
      break;
    }
  }

  return result;
}

/** Опции селектора тира (включая «без тира»). */
export const REWARD_TIER_OPTIONS: Array<{
  label: string;
  value: RewardTier | null;
}> = [
  { label: 'Без тира', value: null },
  ...REWARD_TIERS.map((tier) => ({
    label: REWARD_TIER_LABELS[tier],
    value: tier,
  })),
];

export const SUBSCRIPTION_TYPE_OPTIONS = SUBSCRIPTION_TYPES.map((type) => ({
  label: SUBSCRIPTION_TYPE_LABELS[type],
  value: type,
}));

export const REWARD_PERK_OPTIONS = REWARD_PERKS.map((perk) => ({
  label: REWARD_PERK_LABELS[perk],
  value: perk,
}));

/** Начальное состояние формы выпуска кодов. */
export function getInitialCreateCodesForm(): CreateCodesFormState {
  return {
    rewardTier: null,
    includeSubscription: false,
    subscriptionType: 'GIFT',
    subscriptionMonths: 1,
    perks: [],
    achievements: [],
    count: 1,
    label: '',
  };
}

/**
 * Разворачивает состояние формы в тело запроса, опуская пустые поля.
 * Подписка попадает в запрос только при включённом тумблере.
 */
export function toCreateCodesRequest(
  state: CreateCodesFormState,
): CreateCodesRequest {
  const trimmedLabel = state.label.trim();

  return {
    rewardTier: state.rewardTier ?? undefined,
    subscriptionType: state.includeSubscription
      ? state.subscriptionType
      : undefined,
    subscriptionMonths: state.includeSubscription
      ? state.subscriptionMonths
      : undefined,
    perks: state.perks.length ? [...state.perks] : undefined,
    achievements: state.achievements.length
      ? [...state.achievements]
      : undefined,
    count: state.count,
    label: trimmedLabel || undefined,
  };
}

export const CODE_STATUS_LABELS: Record<CodeStatus, string> = {
  active: 'Активен',
  redeemed: 'Активирован',
  disabled: 'Деактивирован',
};

export const CODE_STATUS_COLORS: Record<
  CodeStatus,
  'success' | 'info' | 'error'
> = {
  active: 'success',
  redeemed: 'info',
  disabled: 'error',
};

/**
 * Производный статус кода: погашенный — «активирован», иначе выключенный —
 * «деактивирован», иначе «активен».
 */
export function getCodeStatus(code: RedemptionCodeResponse): CodeStatus {
  if (code.redeemedBy) {
    return 'redeemed';
  }

  if (code.disabled) {
    return 'disabled';
  }

  return 'active';
}

/** Опции фильтра списка по статусу ('all' — без фильтра). */
export const CODE_STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: string;
}> = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'active' },
  { label: 'Активированные', value: 'redeemed' },
  { label: 'Деактивированные', value: 'disabled' },
];
