import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { getErrorResponse } from '~~/shared/utils';

const verifySchema = z.object({
  token: z.string().uuid(),
});

interface Request {
  query: z.infer<typeof verifySchema>;
}

export default defineEventHandler<Request>(async (event) => {
  let token;

  try {
    ({ token } = await getValidatedQuery(event, verifySchema.parse));
  } catch (err) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  try {
    await $fetch('/api/auth/confirm/email', {
      method: 'put',
      params: { token },
    });

    return sendRedirect(event, '/', StatusCodes.MOVED_PERMANENTLY);
  } catch (e) {
    console.error(e);

    throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }
});
