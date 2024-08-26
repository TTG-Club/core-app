import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { isString } from 'lodash-es';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event);

  if (await User.isUsernameExist(body.username)) {
    throw createError({
      statusCode: StatusCodes.CONFLICT,
      statusMessage: getReasonPhrase(StatusCodes.CONFLICT),
      message: 'Имя пользователя занято',
    });
  }

  if (await User.isEmailExist(body.username)) {
    throw createError({
      statusCode: StatusCodes.CONFLICT,
      statusMessage: getReasonPhrase(StatusCodes.CONFLICT),
      message: 'Электронный адрес занят',
    });
  }

  if (
    !body.password ||
    !(
      isString(body.password) &&
      !/[^\w'\-!"#$%&()*,./:;?@[\]^`{|}~+<=>]+/.test(body.password)
    )
  ) {
    throw createError({
      statusCode: StatusCodes.BAD_REQUEST,
      statusMessage: getReasonPhrase(StatusCodes.BAD_REQUEST),
      message: 'Поля заполнены некорректно',
    });
  }

  const salt = await bcrypt.genSalt(10);

  body.password = await bcrypt.hash(body.password, salt);

  const user = new User(body);

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
  const { serverUrl, mailVerifySecret } = useRuntimeConfig();
  const { generate } = useJwtToken();

  const token = generate(
    {
      email: body.email,
    },
    mailVerifySecret,
    {
      expiresIn: '24h',
    },
  );

  const verifyUrl = `${serverUrl}/auth/verify?token=${token}`;

  try {
    await sendMail({
      to: body.email,
      subject: 'Подтверждение пароля',
      html: `<p>Перейдите по ссылке для подтверждения аккаунта: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
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
