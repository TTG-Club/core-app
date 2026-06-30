/**
 * Типы предметной области подписок и промо-кодов.
 * Зеркалят DTO бэкенда subscriber-service (club.ttg.subscriber.domain.subscription.rest.dto).
 */

import type { RewardPerk, RewardTier, SubscriptionType } from '~/shared/types';

// Доменные перечисления живут в shared/types — переэкспортируем для потребителей фичи.
export type { RewardPerk, RewardTier, SubscriptionType };

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
