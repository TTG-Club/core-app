import bcrypt from 'bcrypt';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { ONE_DAY_IN_SECONDS, USER_TOKEN_COOKIE } from '~/utils/const';
import { getRequestOrigin } from '~/server/utils/getRequestOrigin';

interface Request {
  body: {
    usernameOrEmail: string;
    password: string;
    remember?: boolean;
  };
}
export default defineEventHandler<Request>(async (event) => {
  const { usernameOrEmail, password, remember } = await readBody(event);

  let user;

  try {
    user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    })
      .select({ password: true })
      .lean()
      .exec();
  } catch (err) {
    throw createError({
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      statusMessage: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      message: 'Неизвестная ошибка',
    });
  }

  if (!user) {
    throw createError({
      statusCode: StatusCodes.BAD_REQUEST,
      statusMessage: getReasonPhrase(StatusCodes.BAD_REQUEST),
      message: 'Неправильный логин или пароль',
    });
  }

  try {
    await bcrypt.compare(password, user.password);
  } catch (err) {
    throw createError({
      statusCode: StatusCodes.BAD_REQUEST,
      statusMessage: getReasonPhrase(StatusCodes.BAD_REQUEST),
      message: 'Неправильный логин или пароль',
    });
  }

  const token = generateAuthJwt({
    origin: getRequestOrigin(event),
    username: user.username,
    remember,
  });

  setCookie(event, USER_TOKEN_COOKIE, token, {
    maxAge: ONE_DAY_IN_SECONDS * (remember ? 30 : 1),
    sameSite: true,
  });
});
