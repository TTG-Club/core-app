import { isString } from 'lodash-es';
import { StatusCodes } from 'http-status-codes';
import { ONE_DAY_IN_SECONDS } from '~/utils/const';

interface Request {
  query: {
    token: string;
  };
}

export default defineEventHandler<Request>(async (event) => {
  const { token } = getQuery(event);

  if (!isString(token)) {
    return sendRedirect(event, '/', StatusCodes.BAD_REQUEST);
  }

  const { mailVerifySecret } = useRuntimeConfig();
  const { verify } = useJwt();

  let email = '';

  try {
    const payload = verify({
      token,
      secret: mailVerifySecret,
    });

    if (
      isString(payload) ||
      !payload.email ||
      payload.origin === useNitroOrigin(event)
    ) {
      return sendRedirect(event, '/', StatusCodes.BAD_REQUEST);
    }

    email = payload.email;
  } catch (err) {
    return sendRedirect(event, '/', StatusCodes.BAD_REQUEST);
  }

  try {
    const user = await User.findByEmail(email);

    if (!user || user.verified) {
      return sendRedirect(event, '/', StatusCodes.BAD_REQUEST);
    }

    await user.updateOne({ verified: true });
    await user.save();
  } catch (err) {
    return sendRedirect(event, '/', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  setCookie(event, 'email-verified', 'true', { maxAge: ONE_DAY_IN_SECONDS });

  return sendRedirect(event, '/', StatusCodes.OK);
});
