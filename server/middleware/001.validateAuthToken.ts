import type { H3Event } from 'h3';

import {
  clearUserAuthCookies,
  isInvalidRefreshTokenError,
  refreshUserAuthCookies,
} from '#server/utils/authService';
import { USER_TOKEN_COOKIE } from '#shared/consts';

/**
 * Подменяет access-токен в cookie-заголовке ЗАПРОСА свежим значением, чтобы тот
 * же SSR-рендер видел актуальную сессию. Шапка ([UserHelmet]) определяет статус
 * входа через useCookie(USER_TOKEN_COOKIE); без этого после протухания короткого
 * access-токена (при ещё живом refresh) первый F5 рисовал «разлогинен» и давал
 * hydration mismatch, хотя сессия жива и уже продлена в Set-Cookie ответа.
 */
function syncRequestTokenCookie(event: H3Event, accessToken: string): void {
  const cookieHeader = event.node.req.headers.cookie ?? '';

  const cookiePairs = cookieHeader
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .filter((pair) => !pair.startsWith(`${USER_TOKEN_COOKIE}=`));

  cookiePairs.push(`${USER_TOKEN_COOKIE}=${accessToken}`);
  event.node.req.headers.cookie = cookiePairs.join('; ');
}

export default defineEventHandler(async (event) => {
  try {
    await verifyToken(event);
  } catch {
    try {
      const tokenResponse = await refreshUserAuthCookies(event);

      Object.assign(event.node.req.headers, {
        authorization: `${tokenResponse.tokenType} ${tokenResponse.accessToken}`,
      });

      syncRequestTokenCookie(event, tokenResponse.accessToken);
    } catch (refreshError) {
      // Стираем сессию только при однозначном отказе auth-service (refresh
      // token недействителен). Временный сбой (сеть/5xx/429) оставляет cookie
      // нетронутыми — иначе секундная недоступность auth-service разлогинивает
      // пользователя с ещё живым refresh token.
      if (isInvalidRefreshTokenError(refreshError)) {
        clearUserAuthCookies(event);
      }
    }
  }
});
