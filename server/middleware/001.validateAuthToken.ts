import { USER_TOKEN_COOKIE } from '~~/shared/consts';

export default defineEventHandler((event) => {
  try {
    verifyToken(event);
  } catch (err) {
    deleteCookie(event, USER_TOKEN_COOKIE);
  }
});
