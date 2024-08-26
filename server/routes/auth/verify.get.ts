import { isString } from 'lodash-es';
import { StatusCodes } from 'http-status-codes';

export default defineEventHandler(async (event) => {
  const { token } = getQuery(event);

  if (!isString(token)) {
    return sendRedirect(event, '/', StatusCodes.BAD_REQUEST);
  }

  const { mailVerifySecret } = useRuntimeConfig();
  const { verify } = useJwtToken();

  let email = '';

  try {
    const payload = verify(token, mailVerifySecret);

    if (isString(payload) || !payload.email) {
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

  setCookie(event, 'emailVerified', 'true', { maxAge: 60 * 5 });
  return sendRedirect(event, '/', StatusCodes.OK);
});
