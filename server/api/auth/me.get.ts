import {
  fetchAuthService,
  parseAuthJwtPayload,
  parseAuthUserResponse,
} from '#server/utils/authService';

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event);
  const tokenPayload = parseAuthJwtPayload(await verifyJwt(token));

  const [user, displayName] = await Promise.all([
    fetchAuthService<unknown>('/api/auth/me', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }).then(parseAuthUserResponse),
    fetchUserDisplayName(token),
  ]);

  return {
    ...user,
    id: tokenPayload.sub ?? null,
    roles: tokenPayload.roles,
    displayName,
  };
});
