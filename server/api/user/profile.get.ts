import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export default defineEventHandler((event) => {
  try {
    return getUserFromToken(event);
  } catch (err) {
    return createError({
      status: StatusCodes.UNAUTHORIZED,
      statusText: getReasonPhrase(StatusCodes.UNAUTHORIZED),
    });
  }
});
