import { clearUserTokenCookie } from '#server/utils/authService';

export default defineEventHandler((event) => {
  clearUserTokenCookie(event);

  return {
    success: true,
  };
});
