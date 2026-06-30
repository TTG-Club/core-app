/**
 * Типы раздела «Активация кодов» (личный кабинет пользователя).
 * Зеркалят USER-DTO бэкенда subscriber-service (club.ttg.subscriber.domain.subscription.rest.dto).
 */

import type {
  RewardAvailability,
  RewardPerk,
  RewardTier,
  SubscriptionStatus,
  SubscriptionType,
} from '~/shared/types';

// Доменные перечисления живут в shared/types — переэкспортируем для потребителей фичи.
export type {
  RewardAvailability,
  RewardPerk,
  RewardTier,
  SubscriptionStatus,
  SubscriptionType,
};

/** Награда пользователя со ссылкой и статусом готовности (UserRewardResponse). */
export interface UserReward {
  perk: RewardPerk;
  grantedAt: string | null;
  title: string | null;
  url: string | null;
  availability: RewardAvailability | null;
  note: string | null;
}

/** Подписка пользователя (SubscriptionResponse). */
export interface Subscription {
  id: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  durationMonths: number;
  ownerUsername: string | null;
  registeredAt: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Код, погашенный текущим пользователем, с резолвом наград (MyRedemptionResponse).
 * `rewards` — перки кода (пресет тира ∪ доп. перки) со ссылками и статусом готовности.
 * `achievements` — коды достижений строками (subscriber-service отдаёт их как есть).
 */
export interface MyRedemption {
  id: string;
  code: string;
  redeemedAt: string | null;
  rewardTier: RewardTier | null;
  rewards: UserReward[];
  achievements: string[];
  subscription: Subscription | null;
}

/** Ответ на POST /api/subscriptions/redeem (RedeemResponse). */
export interface RedeemResult {
  subscription: Subscription | null;
  grantedPerks: RewardPerk[];
  grantedAchievements: string[];
}
