import type { H3Event } from 'h3';
import { ROLE, type UserProfile } from '~~/shared/types/user';

export const getUserFromToken = async (
  event: H3Event,
): Promise<UserProfile> => {
  const authHeader =
    getHeader(event, 'authorization') || getHeader(event, 'Authorization');

  const authToken = authHeader?.replace(/^bearer /i, '');

  if (!authToken) {
    throw new Error('User session is not defined');
  }

  try {
    const payload = verifyAuthJwt(authToken);
    const user = await User.findByUsername(payload.username);
    const flatUser = user.toObject();

    if (!flatUser.role) {
      flatUser.role = ROLE.USER;
    }

    return flatUser;
  } catch (err) {
    return Promise.reject(err);
  }
};
