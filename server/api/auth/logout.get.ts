export default defineEventHandler((event) => {
  clearUserTokenCookie(event);

  return {
    success: true,
  };
});
