import { StatusCodes } from 'http-status-codes';

export default defineEventHandler((event) => {
  try {
    return getUserFromToken(event);
  } catch (err) {
    return createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }
});
