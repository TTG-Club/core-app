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

const authAdminUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1),
  email: z.string().email(),
  enabled: z.boolean(),
  emailVerified: z.boolean(),
  accountLocked: z.boolean(),
  credentialsExpired: z.boolean(),
  roles: z.array(z.string().min(1)),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const authAdminRolesSchema = z.array(authAdminRoleSchema);
const authAdminUsersSchema = z.array(authAdminUserSchema);

export type AuthAdminRoleResponse = z.infer<typeof authAdminRoleSchema>;
export type AuthAdminUserResponse = z.infer<typeof authAdminUserSchema>;

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
 * Проверяет список пользователей, полученный от auth-service.
 */
export function parseAuthAdminUsersResponse(
  payload: unknown,
): AuthAdminUserResponse[] {
  return authAdminUsersSchema.parse(payload);
}

/**
 * Проверяет список ролей, полученный от auth-service.
 */
export function parseAuthAdminRolesResponse(
  payload: unknown,
): AuthAdminRoleResponse[] {
  return authAdminRolesSchema.parse(payload);
}
