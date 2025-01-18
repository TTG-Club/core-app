import { USER_TOKEN_COOKIE } from '~~/shared/utils/const';
import { verifyToken } from '~~/server/utils/jwt';

export default defineEventHandler((event) => {
  try {
    verifyToken(event);
  } catch (err) {
    deleteCookie(event, USER_TOKEN_COOKIE);
  }
});
