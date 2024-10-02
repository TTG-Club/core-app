import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export default defineEventHandler((event) => {
  let user;

  try {
    user = getUserFromToken(event);
  } catch (err) {
    return createError({
      status: StatusCodes.UNAUTHORIZED,
      statusText: getReasonPhrase(StatusCodes.UNAUTHORIZED),
    });
  }

  return user;
});
