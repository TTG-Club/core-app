import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import {
  assertMailerConfigured,
  assertMailingAdmin,
  getMailErrorMessage,
  getMailingSiteUrl,
  sendCampaignMail,
} from '#server/utils/mailer';
import { renderCampaignLetter } from '#server/utils/mailingTemplate';
import {
  MAILING_BODY_MAX_LENGTH,
  MAILING_SAMPLE_CODE,
  MAILING_SUBJECT_MAX_LENGTH,
} from '#shared/consts';
import { applyMailingPlaceholders } from '#shared/utils';

const testMailingSchema = z.object({
  subject: z.string().trim().min(1).max(MAILING_SUBJECT_MAX_LENGTH),
  bodyText: z.string().trim().min(1).max(MAILING_BODY_MAX_LENGTH),
  email: z.email(),
});

/**
 * Отправляет пробное письмо на один адрес с кодом-образцом.
 *
 * Реальный код НЕ выпускается: это проверка вёрстки письма и работоспособности
 * SMTP перед настоящей рассылкой.
 */
export default defineEventHandler(async (event) => {
  await assertMailingAdmin(event);

  const parsedBody = testMailingSchema.safeParse(await readBody(event));

  if (!parsedBody.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  assertMailerConfigured();

  const { subject, bodyText, email } = parsedBody.data;

  const letter = renderCampaignLetter({
    subject,
    bodyText,
    code: MAILING_SAMPLE_CODE,
    email,
    siteUrl: getMailingSiteUrl(event),
  });

  try {
    await sendCampaignMail({
      to: email,
      subject: applyMailingPlaceholders(subject, MAILING_SAMPLE_CODE, email),
      text: letter.text,
      html: letter.html,
    });
  } catch (error) {
    consola.error(
      `[mailing] Не удалось отправить тестовое письмо на ${email}: ${getMailErrorMessage(error)}`,
    );

    throw createError(
      getErrorResponse(StatusCodes.BAD_GATEWAY, {
        message: getMailErrorMessage(error),
      }),
    );
  }

  return { email, code: MAILING_SAMPLE_CODE };
});
