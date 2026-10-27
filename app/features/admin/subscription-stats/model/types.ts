import type { SubscriptionStatus, SubscriptionType } from '~/shared/types';

/** Состояние платежа в subscriber-service. */
export type PaymentStatus = 'CREATED' | 'PAID' | 'REJECTED';

/** Значение фильтра списка покупок. */
export type PaymentFilterValue = PaymentStatus | 'ALL';

/** Пункт фильтра списка покупок. */
export interface PaymentFilterOption {
  label: string;
  value: PaymentFilterValue;
}

/** Платёж за подписку (GET /api/admin/payments). */
export interface AdminPayment {
  id: string;
  username: string;
  email: string | null;
  amount: number;
  currency: string;
  months: number;
  status: PaymentStatus;
  /** Тестовый платёж без реального списания: в итоги не входит. */
  testMode: boolean;
  paidAt: string | null;
  createdAt: string;
}

/** Подписка пользователя (GET /api/subscriptions/all). */
export interface AdminSubscription {
  id: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  durationMonths: number;
  /** null — подписка ещё не закреплена за пользователем. */
  ownerUsername: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

/** Итоги для плиток статистики. */
export interface SubscriptionStatsSummary {
  /** Пользователи, у которых сейчас есть активная подписка. */
  activeSubscribers: number;
  activeBought: number;
  activeGifted: number;
  totalSubscriptions: number;
  /** Оплаченные платежи без тестовых. */
  paidPayments: number;
  paidMonths: number;
  /** Платежи, по которым пользователь открыл форму, но не оплатил. */
  unpaidPayments: number;
  revenue: number;
  /** Разные пользователи, оплатившие хотя бы раз. */
  payingUsers: number;
}
