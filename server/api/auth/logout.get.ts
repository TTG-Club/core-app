import { clearUserAuthCookies } from '#server/utils/authService';

export default defineEventHandler((event) => {
  clearUserAuthCookies(event);

  return {
    success: true,
  };
});
