import { isString } from 'lodash-es';
import { StatusCodes } from 'http-status-codes';

export default defineEventHandler(async (event) => {
  const { email, username } = getQuery(event);

  if (isString(email) && (await User.isEmailExist(email))) {
    return createError({ status: StatusCodes.IM_A_TEAPOT });
  }

  if (isString(username) && (await User.isUsernameExist(username))) {
    return createError({ status: StatusCodes.IM_A_TEAPOT });
  }
});
