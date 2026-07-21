import type { SubscriptionStatus, SubscriptionType } from '~/shared/types';

export interface AdminRoleResponse {
  id: number;
  name: string;
}

/** Статус аккаунта пользователя в auth-service. */
export type AdminUserStatus = 'ACTIVE' | 'BANNED' | 'DELETED';

/** Совпадение поиска по отображаемому имени (подсказка в админке). */
export interface AdminDisplayNameMatch {
  login: string;
  displayName: string;
}

export interface AdminUserResponse {
  id: string;
  username: string;
  email: string;
  /** Отображаемое имя из core-api; null, если не задано или core-api недоступен. */
  displayName?: string | null;
  enabled: boolean;
  emailVerified: boolean;
  accountLocked: boolean;
  credentialsExpired: boolean;
  /** Поля статуса блокировки опциональны: старые сборки auth-service их не отдают. */
  status?: AdminUserStatus | null;
  statusReason?: string | null;
  statusChangedAt?: string | null;
  bannedUntil?: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Результат массовой операции над комментариями автора
 * (скрытие при бане / восстановление при разблокировке).
 */
export interface AdminAffectedCommentsResponse {
  affected: number;
}

/** Вкладка детальной панели пользователя в админке. */
export type AdminUserDetailTab = 'main' | 'subscription' | 'comments';

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
