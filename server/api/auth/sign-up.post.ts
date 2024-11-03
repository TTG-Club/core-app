import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signUpSchema = z.object({
  username: z
    .string()
    .min(3)
    .refine((string) => !string.startsWith(' ') && !string.endsWith(' ')),
  email: z
    .string()
    .email()
    .refine((string) => !string.startsWith(' ') && !string.endsWith(' ')),
  password: z
    .string()
    .min(8)
    .refine((string) => !/[^\w'\-!"#$%&()*,./:;?@[\]^`{|}~+<=>]+/.test(string))
    .refine((string) => !string.startsWith(' ') && !string.endsWith(' ')),
});

interface Request {
  body: z.infer<typeof signUpSchema>;
}

export default defineEventHandler<Request>(async (event) => {
  const { username, email, password } = await readValidatedBody(
    event,
    signUpSchema.parse,
  );

  if (await User.isUsernameExist(username)) {
    throw createError({
      statusCode: StatusCodes.CONFLICT,
      statusMessage: getReasonPhrase(StatusCodes.CONFLICT),
      message: 'Имя пользователя занято',
    });
  }

  if (await User.isEmailExist(username)) {
    throw createError({
      statusCode: StatusCodes.CONFLICT,
      statusMessage: getReasonPhrase(StatusCodes.CONFLICT),
      message: 'Электронный адрес занят',
    });
  }

  const newUser = { username, email, password };

  const salt = await bcrypt.genSalt(10);

  newUser.password = await bcrypt.hash(password, salt);

  const user = new User(newUser);

  try {
    await user.validate();
  } catch (err) {
    throw createError({
      statusCode: StatusCodes.BAD_REQUEST,
      statusMessage: getReasonPhrase(StatusCodes.BAD_REQUEST),
      message: 'Поля заполнены некорректно',
    });
  }

  try {
    await user.save();
  } catch (err) {
    throw createError({
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      statusMessage: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      message: 'Неизвестная ошибка при сохранении',
    });
  }

  const { sendMail } = useNodeMailer();
  const { mailVerifySecret } = useRuntimeConfig();
  const origin = getRequestOrigin(event);

  const token = generateJwt({
    payload: {
      email: email,
      origin,
    },
    secret: mailVerifySecret,
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
    console.error(err);

    await user.deleteOne().exec();

    throw createError({
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      statusMessage: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      message: 'Неизвестная ошибка при сохранении',
    });
  }
});
