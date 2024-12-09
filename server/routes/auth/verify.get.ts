import { isString } from 'lodash-es';
import { StatusCodes } from 'http-status-codes';
import { ONE_DAY_IN_SECONDS } from '~~/shared/utils/const';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string(),
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

  const {
    email: { secret },
  } = useRuntimeConfig();

  let email = '';

  try {
    const payload = verifyJwt({
      token,
      secret,
    });

    if (
      isString(payload) ||
      !payload.email ||
      payload.origin !== getRequestOrigin(event)
    ) {
      return createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

    email = payload.email;
  } catch (err) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });

    if (user.verified) {
      return sendRedirect(event, '/', StatusCodes.MOVED_PERMANENTLY);
    }

    await prisma.user.update({
      where: { email },
      data: {
        verified: true,
      },
    });
  } catch (err) {
    return createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }

  setCookie(event, 'email-verified', 'true', { maxAge: ONE_DAY_IN_SECONDS });

  return sendRedirect(event, '/', StatusCodes.MOVED_PERMANENTLY);
});
