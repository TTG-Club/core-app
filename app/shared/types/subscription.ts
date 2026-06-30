/**
 * Доменные перечисления подписок и наград — общие для админки и личного кабинета.
 * Зеркалят перечисления subscriber-service (club.ttg.subscriber.domain.subscription.model).
 * Конкретные DTO/формы живут в своих фичах и опираются на эти типы.
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

/** Готовность контента награды. */
export type RewardAvailability = 'AVAILABLE' | 'COMING_SOON';

/** Статус подписки. */
export type SubscriptionStatus =
  | 'CREATED'
  | 'REGISTERED'
  | 'ACTIVE'
  | 'EXPIRED';
