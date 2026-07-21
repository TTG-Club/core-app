import {
  clearUserAuthCookies,
  isInvalidRefreshTokenError,
  refreshUserAuthCookies,
} from '#server/utils/authService';

export default defineEventHandler(async (event) => {
  try {
    await verifyToken(event);
  } catch {
    try {
      const tokenResponse = await refreshUserAuthCookies(event);

      Object.assign(event.node.req.headers, {
        authorization: `${tokenResponse.tokenType} ${tokenResponse.accessToken}`,
      });
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
