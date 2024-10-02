import { USER_TOKEN_COOKIE } from '~~/shared/utils/const';
import jwt from 'jsonwebtoken';

export default defineEventHandler((event) => {
  const authHeader =
    getHeader(event, 'authorization') || getHeader(event, 'Authorization');

  if (!authHeader) {
    return;
  }

  const authToken = authHeader?.replace(/^bearer /i, '');

  if (!authToken) {
    return;
  }

  const removeCookie = () => {
    setCookie(event, USER_TOKEN_COOKIE, '');
  };

  try {
    const payload = verifyAuthJwt(authToken);

    if (payload.origin !== getRequestOrigin(event)) {
      removeCookie();

      return;
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      removeCookie();
    }
  }
});
