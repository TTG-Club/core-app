import { USER_TOKEN_COOKIE } from '#shared/consts';

export default defineEventHandler(async (event) => {
  try {
    await verifyToken(event);
  } catch (err) {
    deleteCookie(event, USER_TOKEN_COOKIE);
  }
});
