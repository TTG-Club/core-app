import type { H3Event } from 'h3';

export const getUserFromToken = (event: H3Event) => {
  const authHeader =
    getHeader(event, 'authorization') || getHeader(event, 'Authorization');

  const authToken = authHeader?.replace(/^bearer /i, '');

  if (!authToken) {
    throw new Error('User session is not defined');
  }

  try {
    const payload = verifyAuthJwt(authToken);

    return prisma.user.findUniqueOrThrow({
      where: { username: payload.username },
      omit: {
        password: true,
        verified: true,
      },
    });
  } catch (err) {
    return Promise.reject(err);
  }
};
