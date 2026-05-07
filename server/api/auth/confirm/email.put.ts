import {
  createAuthValidationError,
  fetchAuthService,
} from '#server/utils/authService';

export default defineEventHandler(async (event) => {
  const { token } = getQuery(event);

  if (typeof token !== 'string' || !token) {
    throw createAuthValidationError();
  }

  await fetchAuthService<unknown>('/api/auth/verify-email', {
    method: 'GET',
    query: {
      token,
    },
  });

  return null;
});
