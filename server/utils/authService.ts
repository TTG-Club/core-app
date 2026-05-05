import type { H3Event } from 'h3';

import { getRequestURL } from 'h3';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { USER_REFRESH_TOKEN_COOKIE, USER_TOKEN_COOKIE } from '#shared/consts';
import { Role } from '~/shared/types';

const authTokenSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.string().min(1),
  expiresIn: z.number().int().positive(),
  refreshExpiresIn: z.number().int().positive(),
});

const authUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
});

const authJwtPayloadSchema = z.object({
  username: z.string().min(1),
  roles: z.array(z.nativeEnum(Role)),
});

const FRONTEND_ORIGIN_HEADER = 'X-Frontend-Origin';
const DEFAULT_FRONTEND_ORIGIN_PROTOCOL = 'https://';

export type AuthTokenResponse = z.infer<typeof authTokenSchema>;

export interface AuthClientTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

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
 * Возвращает origin из полного URL или undefined для некорректного значения.
 */
function parseUrlOrigin(url: string | undefined): string | undefined {
  const normalizedUrl = url?.trim();

  if (!normalizedUrl) {
    return undefined;
  }

  try {
    return new URL(normalizedUrl).origin;
  } catch {
    try {
      return new URL(`${DEFAULT_FRONTEND_ORIGIN_PROTOCOL}${normalizedUrl}`)
        .origin;
    } catch {
      return undefined;
    }
  }
}

/**
 * Возвращает заголовки с публичным origin фронта для server-to-server запросов.
 */
export function getFrontendOriginHeaders(event: H3Event): Headers {
  const headers = new Headers();
  const configuredOrigin = parseUrlOrigin(process.env.NUXT_SITE_URL);
  const { origin: requestOrigin } = getRequestURL(event);

  headers.set(FRONTEND_ORIGIN_HEADER, configuredOrigin || requestOrigin);

  return headers;
}

/**
 * Проверяет ответ с access token от внешнего сервиса аутентификации.
 */
export function parseAuthTokenResponse(payload: unknown): AuthTokenResponse {
  return authTokenSchema.parse(payload);
}

/**
 * Возвращает безопасный для клиента ответ без refresh token.
 */
export function toAuthClientTokenResponse(
  tokenResponse: AuthTokenResponse,
): AuthClientTokenResponse {
  return {
    accessToken: tokenResponse.accessToken,
    expiresIn: tokenResponse.expiresIn,
    tokenType: tokenResponse.tokenType,
  };
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
 * Возвращает refresh token из cookie приложения.
 */
function getUserRefreshTokenCookie(event: H3Event): string | undefined {
  return getCookie(event, USER_REFRESH_TOKEN_COOKIE);
}

/**
 * Сохраняет access token пользователя в cookie приложения.
 */
function setUserTokenCookie(
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
 * Сохраняет refresh token пользователя в защищенную cookie приложения.
 */
function setUserRefreshTokenCookie(
  event: H3Event,
  tokenResponse: AuthTokenResponse,
): void {
  setCookie(event, USER_REFRESH_TOKEN_COOKIE, tokenResponse.refreshToken, {
    httpOnly: true,
    maxAge: tokenResponse.refreshExpiresIn,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV !== 'development',
  });
}

/**
 * Сохраняет access и refresh token пользователя в cookie приложения.
 */
export function setUserAuthCookies(
  event: H3Event,
  tokenResponse: AuthTokenResponse,
): void {
  setUserTokenCookie(event, tokenResponse);
  setUserRefreshTokenCookie(event, tokenResponse);
}

/**
 * Удаляет cookie с access и refresh token пользователя.
 */
export function clearUserAuthCookies(event: H3Event): void {
  deleteCookie(event, USER_TOKEN_COOKIE, {
    path: '/',
  });

  deleteCookie(event, USER_REFRESH_TOKEN_COOKIE, {
    path: '/',
  });
}

/**
 * Обновляет пару token через auth-service и сохраняет результат в cookie приложения.
 */
export async function refreshUserAuthCookies(
  event: H3Event,
): Promise<AuthTokenResponse> {
  const refreshToken = getUserRefreshTokenCookie(event);

  if (!refreshToken) {
    throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }

  const tokenResponse = parseAuthTokenResponse(
    await fetchAuthService<unknown>('/api/auth/refresh', {
      body: { refreshToken },
      method: 'POST',
    }),
  );

  setUserAuthCookies(event, tokenResponse);

  return tokenResponse;
}

/**
 * Создает ошибку некорректного запроса для auth endpoint.
 */
export function createAuthValidationError(): ReturnType<typeof createError> {
  return createError(getErrorResponse(StatusCodes.BAD_REQUEST));
}
