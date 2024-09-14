import { isString } from 'lodash-es';

export default defineEventHandler(async (event) => {
  const { email, username } = getQuery(event);

  const emailExist = isString(email) && (await User.isEmailExist(email));
  const usernameExist =
    isString(username) && (await User.isUsernameExist(username));

  return emailExist || usernameExist;
});
