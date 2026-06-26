/**
 * Типы предметной области подписок и промо-кодов.
 * Зеркалят DTO бэкенда (club.ttg.dnd5.domain.subscription.rest.dto).
 */

/** Тип подписки. */
export type SubscriptionType = 'GIFT' | 'BUY';

/** Краудфандинговый тир-пресет (кумулятивный). */
export type RewardTier =
  | 'TIER_1'
  | 'TIER_2'
  | 'TIER_3'
  | 'TIER_4'
  | 'TIER_5'
  | 'TIER_6';

/** Постоянная косметическая/контентная награда (перк). */
export type RewardPerk =
  | 'EARLY_ACCESS_DOWNLOAD'
  | 'MAP_TOKENS_DOWNLOAD'
  | 'ADVENTURE_DOWNLOAD'
  | 'DEV_CHAT_ACCESS'
  | 'PROFILE_BADGE'
  | 'AVATAR_FRAME'
  | 'NICKNAME_COLOR'
  | 'PROFILE_ICON'
  | 'APP_CREDITS';

/**
 * Тело запроса на выпуск пачки кодов (POST /api/subscriptions/codes).
 * Код должен нести хотя бы что-то одно: подписку, тир, перки или достижения.
 */
export interface CreateCodesRequest {
  /** Тип подписки; обязателен, если задан subscriptionMonths. */
  subscriptionType?: SubscriptionType;
  /** Срок подписки в месяцах (>= 1); опускается — код без подписки. */
  subscriptionMonths?: number;
  /** Тир-пресет; опускается — без пресета. */
  rewardTier?: RewardTier;
  /** Произвольный набор перков помимо тира. */
  perks?: RewardPerk[];
  /** Произвольный набор кодов достижений. */
  achievements?: string[];
  /** Сколько одинаковых кодов выпустить (1..1000). */
  count?: number;
  /** Пометка админа для всей пачки. */
  label?: string;
}

/**
 * Выпущенный одноразовый код (ответ POST /api/subscriptions/codes).
 */
export interface RedemptionCodeResponse {
  id: string;
  code: string;
  subscriptionType: SubscriptionType | null;
  subscriptionMonths: number | null;
  rewardTier: RewardTier | null;
  perks: RewardPerk[];
  achievements: string[];
  label: string | null;
  redeemedBy: string | null;
  redeemedAt: string | null;
  disabled: boolean;
  disabledAt: string | null;
  disabledBy: string | null;
  /** Кто выпустил код. Появится после добавления поля на бэкенде (пока может отсутствовать). */
  createdBy?: string | null;
  createdAt: string;
}

/** Производный статус кода для отображения и фильтра. */
export type CodeStatus = 'active' | 'redeemed' | 'disabled';

/**
 * Локальное состояние формы выпуска кодов.
 * Поля includeSubscription/subscriptionMonths/subscriptionType разворачиваются
 * в CreateCodesRequest на сабмите (см. toCreateCodesRequest).
 */
export interface CreateCodesFormState {
  rewardTier: RewardTier | null;
  includeSubscription: boolean;
  subscriptionType: SubscriptionType;
  subscriptionMonths: number;
  perks: RewardPerk[];
  achievements: string[];
  count: number;
  label: string;
}
