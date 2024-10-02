import { isString } from 'lodash-es';
import { z } from 'zod';

const existSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
});

interface Request {
  query: z.infer<typeof existSchema>;
}

export default defineEventHandler<Request>(async (event) => {
  const { email, username } = await getValidatedQuery(event, existSchema.parse);

  const emailExist = isString(email) && (await User.isEmailExist(email));

  const usernameExist =
    isString(username) && (await User.isUsernameExist(username));

  return emailExist || usernameExist;
});
