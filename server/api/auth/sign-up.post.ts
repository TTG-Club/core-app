import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signUpSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(1000)
    .refine((string) => !string.startsWith(' ') && !string.endsWith(' ')),
  email: z
    .string()
    .email()
    .refine((string) => !string.startsWith(' ') && !string.endsWith(' ')),
  password: z
    .string()
    .min(8)
    .max(256)
    .refine((string) => !/[^\w'\-!"#$%&()*,./:;?@[\]^`{|}~+<=>]+/.test(string))
    .refine((string) => !string.startsWith(' ') && !string.endsWith(' ')),
});

interface Request {
  body: z.infer<typeof signUpSchema>;
}

export default defineEventHandler<Request>(async (event) => {
  let username, email, password;

  try {
    ({ username, email, password } = await readValidatedBody(
      event,
      signUpSchema.parse,
    ));
  } catch (err) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Поля заполнены неверно',
      }),
    );
  }

  if (
    await prisma.user.findUnique({
      where: {
        username,
      },
    })
  ) {
    throw createError(
      getErrorResponse(StatusCodes.CONFLICT, {
        message: 'Имя пользователя занято',
      }),
    );
  }

  if (
    await prisma.user.findUnique({
      where: {
        email,
      },
    })
  ) {
    throw createError(
      getErrorResponse(StatusCodes.CONFLICT, {
        message: 'Электронный адрес занят',
      }),
    );
  }

  const newUser = { username, email, password };

  const salt = await bcrypt.genSalt(10);

  newUser.password = await bcrypt.hash(password, salt);

  try {
    await prisma.user.create({
      data: newUser,
    });
  } catch (err) {
    throw createError(
      getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'Неизвестная ошибка при сохранении',
        data: err,
      }),
    );
  }

  const { sendMail } = useNodeMailer();

  const {
    email: { secret },
  } = useRuntimeConfig();

  const origin = getRequestOrigin(event);

  const token = generateJwt({
    payload: {
      email: email,
      origin,
    },
    secret,
    options: {
      expiresIn: '24h',
    },
  });

  const verifyUrl = `${origin}/auth/verify?token=${token}`;

  try {
    await sendMail({
      to: email,
      subject: 'Подтверждение пароля',
      html: `<p>Перейдите по ссылке для подтверждения аккаунта: <a href="${verifyUrl}">${verifyUrl}</a></p><p>Ссылка действительна в течение суток.</p>`,
    });
  } catch (err) {
    await prisma.user.delete({
      where: {
        username,
      },
    });

    throw createError(
      getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'Неизвестная ошибка при сохранении',
        data: err,
      }),
    );
  }
});
