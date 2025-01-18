import { USER_TOKEN_COOKIE } from '~~/shared/utils/const';

export default defineEventHandler((event) => {
  try {
    getUserFromToken(event);
  } catch (err) {
    deleteCookie(event, USER_TOKEN_COOKIE);
  }
});
