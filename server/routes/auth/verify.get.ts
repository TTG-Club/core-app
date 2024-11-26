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
  const { token } = await getValidatedQuery(event, verifySchema.parse);

  if (!isString(token)) {
    return sendRedirect(event, '/', StatusCodes.BAD_REQUEST);
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
      return sendRedirect(event, '/', StatusCodes.BAD_REQUEST);
    }

    email = payload.email;
  } catch (err) {
    return sendRedirect(event, '/', StatusCodes.BAD_REQUEST);
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });

    if (!user || user.verified) {
      return sendRedirect(event, '/', StatusCodes.BAD_REQUEST);
    }

    await prisma.user.update({
      where: { email },
      data: {
        verified: true,
      },
    });
  } catch (err) {
    return sendRedirect(event, '/', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  setCookie(event, 'email-verified', 'true', { maxAge: ONE_DAY_IN_SECONDS });

  return sendRedirect(event, '/', StatusCodes.OK);
});
