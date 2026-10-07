import {
  fetchAuthService,
  parseAuthJwtPayload,
  parseAuthUserResponse,
} from '#server/utils/authService';
import { fetchUserNameAndAvatar } from '#server/utils/displayName';

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event);
  const tokenPayload = parseAuthJwtPayload(await verifyJwt(token));

  const [user, nameAndAvatar] = await Promise.all([
    fetchAuthService<unknown>('/api/auth/me', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }).then(parseAuthUserResponse),
    fetchUserNameAndAvatar(token),
  ]);

  return {
    ...user,
    id: tokenPayload.sub ?? null,
    roles: tokenPayload.roles,
    displayName: nameAndAvatar.displayName,
    avatarUrl: nameAndAvatar.avatarUrl,
    // Молчание auth-service о подтверждении не запрещает действия: доступ
    // всё равно решает сервис, а интерфейс лишь объясняет отказ заранее.
    emailVerified: user.emailVerified ?? true,
  };
});
