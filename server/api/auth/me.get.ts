import {
  fetchAuthService,
  parseAuthJwtPayload,
  parseAuthUserResponse,
} from '#server/utils/authService';

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event);
  const tokenPayload = parseAuthJwtPayload(await verifyJwt(token));

  const user = parseAuthUserResponse(
    await fetchAuthService<unknown>('/api/auth/me', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }),
  );

  return {
    ...user,
    roles: tokenPayload.roles,
  };
});
