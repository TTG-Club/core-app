import {
  clearUserAuthCookies,
  refreshUserAuthCookies,
} from '#server/utils/authService';

export default defineEventHandler(async (event) => {
  try {
    await verifyToken(event);
  } catch {
    try {
      const tokenResponse = await refreshUserAuthCookies(event);

      Object.assign(event.node.req.headers, {
        authorization: `${tokenResponse.tokenType} ${tokenResponse.accessToken}`,
      });
    } catch {
      clearUserAuthCookies(event);
    }
  }
});
