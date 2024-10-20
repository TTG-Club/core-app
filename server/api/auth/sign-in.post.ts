import bcrypt from 'bcrypt';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { ONE_DAY_IN_SECONDS, USER_TOKEN_COOKIE } from '~~/shared/utils/const';
import { z } from 'zod';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3),
  password: z.string().min(8),
  remember: z.boolean().optional(),
});

interface Request {
  body: z.infer<typeof loginSchema>;
}

export default defineEventHandler<Request>(async (event) => {
  const { usernameOrEmail, password, remember } = await readValidatedBody(
    event,
    loginSchema.parse,
  );

  let user;

  try {
    user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    })
      .select({
        username: true,
        email: true,
        roles: true,
        password: true,
        verified: true,
      })
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

  const { sendMail } = useNodeMailer();

  try {
    await sendMail({
      to: user.email,
      subject: 'Test',
      html: `<p>test</p>`,
    });
  } catch (err) {
    console.error(err);

    throw createError({
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      statusMessage: getReasonPhrase(StatusCodes.NOT_ACCEPTABLE),
      message: 'Почта не работает!',
    });
  }

  if (!user.verified) {
    throw createError({
      statusCode: StatusCodes.NOT_ACCEPTABLE,
      statusMessage: getReasonPhrase(StatusCodes.NOT_ACCEPTABLE),
      message: 'Ваша учетная запись не активирована',
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
