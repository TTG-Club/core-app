import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { isString } from 'lodash-es';
import bcrypt from 'bcrypt';
import { getRequestOrigin } from '~/server/utils/getRequestOrigin';

interface Request {
  body: {
    username: string;
    email: string;
    password: string;
  };
}

export default defineEventHandler<Request>(async (event) => {
  const { username, email, password } = await readBody(event);

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

  if (
    !password ||
    !(
      isString(password) &&
      !/[^\w'\-!"#$%&()*,./:;?@[\]^`{|}~+<=>]+/.test(password)
    )
  ) {
    throw createError({
      statusCode: StatusCodes.BAD_REQUEST,
      statusMessage: getReasonPhrase(StatusCodes.BAD_REQUEST),
      message: 'Поля заполнены некорректно',
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
