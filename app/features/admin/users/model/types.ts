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

/**
 * Постраничный ответ списка пользователей (envelope Spring Data Page).
 * Совпадает по полям с PageBugReportResponse.
 */
export interface PageAdminUserResponse {
  content: AdminUserResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
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
