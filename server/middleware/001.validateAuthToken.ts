import { USER_TOKEN_COOKIE } from '~~/shared/utils/const';

export default defineEventHandler((event) => {
  const cookie = getCookie(event, USER_TOKEN_COOKIE);

  if (!cookie) {
    return;
  }

  try {
    verifyAuthJwt(cookie);
  } catch (err) {
    setCookie(event, USER_TOKEN_COOKIE, '');
  }
});
