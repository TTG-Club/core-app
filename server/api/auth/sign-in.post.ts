import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
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
  let usernameOrEmail, password, remember;

  try {
    ({ usernameOrEmail, password, remember } = await readValidatedBody(
      event,
      loginSchema.parse,
    ));
  } catch (err) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Неправильный логин или пароль',
      }),
    );
  }

  let user;

  try {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: usernameOrEmail,
          },
          {
            email: usernameOrEmail,
          },
        ],
      },
      select: {
        username: true,
        verified: true,
        password: true,
      },
    });
  } catch (err) {
    throw createError(
      getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR, {
        data: err,
      }),
    );
  }

  if (!user) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Неправильный логин или пароль',
      }),
    );
  }

  if (!user.verified) {
    throw createError(
      getErrorResponse(StatusCodes.NOT_ACCEPTABLE, {
        message: 'Ваша учетная запись не активирована',
      }),
    );
  }

  try {
    await bcrypt.compare(password, user.password);
  } catch (err) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Неправильный логин или пароль',
      }),
    );
  }

  const token = generateAuthJwt({
    origin: getRequestOrigin(event),
    username: user.username,
    remember,
  });

  setCookie(event, USER_TOKEN_COOKIE, token, {
    maxAge: ONE_DAY_IN_SECONDS * (remember ? 30 : 1),
    secure: !import.meta.dev,
    sameSite: true,
  });
});
