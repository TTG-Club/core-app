import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import {
  fetchAuthService,
  parseAuthJwtPayload,
} from '#server/utils/authService';
import { Role } from '~/shared/types';

const authAdminRoleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

/** Статус аккаунта пользователя в auth-service. */
const authAdminUserStatusSchema = z.enum(['ACTIVE', 'BANNED', 'DELETED']);

const authAdminUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1),
  email: z.string().email(),
  enabled: z.boolean(),
  emailVerified: z.boolean(),
  accountLocked: z.boolean(),
  credentialsExpired: z.boolean(),
  // Поля статуса блокировки опциональны: старые сборки auth-service их не отдают.
  status: authAdminUserStatusSchema.nullish(),
  statusReason: z.string().nullish(),
  statusChangedAt: z.string().datetime().nullish(),
  bannedUntil: z.string().datetime().nullish(),
  roles: z.array(z.string().min(1)),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const authAdminRolesSchema = z.array(authAdminRoleSchema);
const authAdminUsersSchema = z.array(authAdminUserSchema);

/**
 * Постраничный ответ списка пользователей (envelope Spring Data Page).
 * Поля совпадают с PageBugReportResponse на фронте.
 */
const authAdminUsersPageSchema = z.object({
  content: authAdminUsersSchema,
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  number: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
  empty: z.boolean(),
});

export type AuthAdminRoleResponse = z.infer<typeof authAdminRoleSchema>;
export type AuthAdminUserResponse = z.infer<typeof authAdminUserSchema>;
export type AuthAdminUsersPageResponse = z.infer<
  typeof authAdminUsersPageSchema
>;

/**
 * Проверяет, что текущий пользователь может работать с админскими методами auth-service.
 */
async function getAdminAuthorizationHeaders(event: H3Event): Promise<Headers> {
  const token = getTokenFromRequest(event);
  const tokenPayload = parseAuthJwtPayload(await verifyJwt(token));

  if (!tokenPayload.roles.includes(Role.ADMIN)) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  const headers = new Headers();

  headers.set('authorization', `Bearer ${token}`);

  return headers;
}

/**
 * Выполняет админский запрос к auth-service от имени текущего администратора.
 */
export async function fetchAuthAdminService<T>(
  event: H3Event,
  path: string,
  options: Parameters<typeof $fetch<T>>[1] = {},
): Promise<T> {
  const authorizationHeaders = await getAdminAuthorizationHeaders(event);
  const requestHeaders = new Headers(options.headers);

  authorizationHeaders.forEach((value, key) => {
    requestHeaders.set(key, value);
  });

  return await fetchAuthService<T>(path, {
    ...options,
    headers: requestHeaders,
  });
}

/**
 * Проверяет постраничный ответ списка пользователей от auth-service.
 */
export function parseAuthAdminUsersPageResponse(
  payload: unknown,
): AuthAdminUsersPageResponse {
  return authAdminUsersPageSchema.parse(payload);
}

/**
 * Проверяет список ролей, полученный от auth-service.
 */
export function parseAuthAdminRolesResponse(
  payload: unknown,
): AuthAdminRoleResponse[] {
  return authAdminRolesSchema.parse(payload);
}

/**
 * Проверяет ответ auth-service с одним пользователем (блокировка/разблокировка).
 */
export function parseAuthAdminUserResponse(
  payload: unknown,
): AuthAdminUserResponse {
  return authAdminUserSchema.parse(payload);
}
