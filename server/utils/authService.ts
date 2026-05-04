import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { USER_TOKEN_COOKIE } from '#shared/consts';
import { Role } from '~/shared/types';

const authTokenSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

const authUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
});

const authJwtPayloadSchema = z.object({
  username: z.string().min(1),
  roles: z.array(z.nativeEnum(Role)),
});

export type AuthTokenResponse = z.infer<typeof authTokenSchema>;

export type AuthUserResponse = z.infer<typeof authUserSchema>;

type AuthJwtPayloadResponse = z.infer<typeof authJwtPayloadSchema>;

/**
 * Возвращает полный URL для запроса к внешнему сервису аутентификации.
 */
function getAuthServicePath(path: string): string {
  const { url } = getAuthSecrets();

  return `${url}${path}`;
}

/**
 * Выполняет запрос к внешнему сервису аутентификации.
 */
export async function fetchAuthService<T>(
  path: string,
  options: Parameters<typeof $fetch<T>>[1] = {},
): Promise<T> {
  return await $fetch<T>(getAuthServicePath(path), options);
}

/**
 * Проверяет ответ с access token от внешнего сервиса аутентификации.
 */
export function parseAuthTokenResponse(payload: unknown): AuthTokenResponse {
  return authTokenSchema.parse(payload);
}

/**
 * Проверяет данные пользователя от внешнего сервиса аутентификации.
 */
export function parseAuthUserResponse(payload: unknown): AuthUserResponse {
  return authUserSchema.parse(payload);
}

/**
 * Проверяет полезную нагрузку JWT, полученного от внешнего сервиса аутентификации.
 */
export function parseAuthJwtPayload(payload: unknown): AuthJwtPayloadResponse {
  return authJwtPayloadSchema.parse(payload);
}

/**
 * Сохраняет access token пользователя в cookie приложения.
 */
export function setUserTokenCookie(
  event: H3Event,
  tokenResponse: AuthTokenResponse,
): void {
  setCookie(event, USER_TOKEN_COOKIE, tokenResponse.accessToken, {
    httpOnly: false,
    maxAge: tokenResponse.expiresIn,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV !== 'development',
  });
}

/**
 * Удаляет cookie с access token пользователя.
 */
export function clearUserTokenCookie(event: H3Event): void {
  deleteCookie(event, USER_TOKEN_COOKIE, {
    path: '/',
  });
}

/**
 * Создает ошибку некорректного запроса для auth endpoint.
 */
export function createAuthValidationError(): ReturnType<typeof createError> {
  return createError(getErrorResponse(StatusCodes.BAD_REQUEST));
}
