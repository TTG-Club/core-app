import type { SubscriptionStatus, SubscriptionType } from '~/shared/types';

export interface AdminRoleResponse {
  id: number;
  name: string;
}

export interface AdminUserResponse {
  id: string;
  username: string;
  email: string;
  enabled: boolean;
  emailVerified: boolean;
  accountLocked: boolean;
  credentialsExpired: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminRoleSelectItem {
  label: string;
  value: number;
}

/** Статус подписки пользователя (зеркалит subscriber-service). */
export type AdminSubscriptionStatus = SubscriptionStatus;

/** Тип подписки пользователя. */
export type AdminSubscriptionType = SubscriptionType;

/**
 * Сводный статус подписки пользователя для админ-карточки.
 * Отдаётся server-роутом /api/admin/subscriptions/{username}.
 */
export interface AdminSubscriptionResponse {
  active: boolean;
  registered?: boolean | null;
  status?: AdminSubscriptionStatus | null;
  type?: AdminSubscriptionType | null;
  startsAt?: string | null;
  expiresAt?: string | null;
}
