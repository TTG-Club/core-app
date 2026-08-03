import type { MailingSendResponse, MailingSendResult } from '#shared/types';

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
import { fetchSubscriberAdminService } from '#server/utils/subscriberAdminService';
import {
  MAILING_BODY_MAX_LENGTH,
  MAILING_CHUNK_SIZE,
  MAILING_LABEL_MAX_LENGTH,
  MAILING_SEND_DELAY_MS,
  MAILING_SUBJECT_MAX_LENGTH,
} from '#shared/consts';
import { applyMailingPlaceholders, buildMailingCodeLabel } from '#shared/utils';

/** Эндпоинт выпуска кодов в subscriber-service. */
const SUBSCRIPTION_CODES_PATH = '/api/subscriptions/codes';

/** Ответ subscriber-service на выпуск пачки кодов (нужен только сам код). */
const createdCodesSchema = z
  .array(z.object({ code: z.string().min(1) }))
  .min(1);

const sendMailingSchema = z.object({
  subject: z.string().trim().min(1).max(MAILING_SUBJECT_MAX_LENGTH),
  bodyText: z.string().trim().min(1).max(MAILING_BODY_MAX_LENGTH),
  // Точный набор тиров валидирует subscriber-service — здесь достаточно формы,
  // чтобы не разъезжаться с бэкендом при появлении нового тира.
  rewardTier: z.string().regex(/^TIER_\d+$/, 'Некорректный тир'),
  label: z.string().trim().max(MAILING_LABEL_MAX_LENGTH).optional(),
  recipients: z
    .array(
      z.object({
        email: z.email(),
        /** Уже выпущенный код — повторная отправка не выпускает новый. */
        code: z.string().trim().min(1).max(64).optional(),
      }),
    )
    .min(1)
    .max(MAILING_CHUNK_SIZE),
});

type SendMailingRequest = z.infer<typeof sendMailingSchema>;

type MailingRecipient = SendMailingRequest['recipients'][number];

/**
 * Ждёт указанное время между письмами: ровный темп отправки снижает шанс
 * попасть под фильтр массовой рассылки.
 *
 * @param milliseconds пауза в миллисекундах
 */
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * Выпускает один код нужного тира и возвращает его строковое значение.
 *
 * @param event событие запроса
 * @param rewardTier тир награды
 * @param label метка кода (в неё попадает адрес получателя)
 */
async function issueCode(
  event: Parameters<typeof fetchSubscriberAdminService>[0],
  rewardTier: string,
  label: string,
): Promise<string> {
  const created = await fetchSubscriberAdminService<unknown>(
    event,
    SUBSCRIPTION_CODES_PATH,
    {
      method: 'POST',
      body: {
        rewardTier,
        count: 1,
        label,
      },
    },
  );

  const parsed = createdCodesSchema.safeParse(created);
  const issued = parsed.success ? parsed.data[0] : undefined;

  if (!issued) {
    throw new Error('subscriber-service не вернул выпущенный код');
  }

  return issued.code;
}

/**
 * Массовая выдача промокодов письмами: на каждый адрес выпускается свой код
 * нужного тира и уходит отдельное письмо.
 *
 * Получатели приходят маленькими пачками (см. `MAILING_CHUNK_SIZE`), внутри
 * пачки письма уходят по одному с паузой. Ошибка по одному адресу не отменяет
 * остальные — каждая строка отчёта возвращается со своим статусом, поэтому
 * администратор видит, кому код уже ушёл, и может повторить только неудачные.
 */
export default defineEventHandler(
  async (event): Promise<MailingSendResponse> => {
    await assertMailingAdmin(event);

    const parsedBody = sendMailingSchema.safeParse(await readBody(event));

    if (!parsedBody.success) {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

    // До выпуска кодов: без рабочего SMTP рассылку начинать нельзя, иначе коды
    // сгорят впустую.
    assertMailerConfigured();

    const { subject, bodyText, rewardTier, label, recipients } =
      parsedBody.data;

    const siteUrl = getMailingSiteUrl(event);

    /**
     * Выпускает код (если он ещё не выпущен) и отправляет письмо одному адресату.
     *
     * @param recipient получатель письма
     */
    async function processRecipient(
      recipient: MailingRecipient,
    ): Promise<MailingSendResult> {
      let code = recipient.code ?? null;

      try {
        if (!code) {
          code = await issueCode(
            event,
            rewardTier,
            buildMailingCodeLabel(label ?? '', recipient.email),
          );
        }

        const letter = renderCampaignLetter({
          subject,
          bodyText,
          code,
          email: recipient.email,
          siteUrl,
        });

        await sendCampaignMail({
          to: recipient.email,
          subject: applyMailingPlaceholders(subject, code, recipient.email),
          text: letter.text,
          html: letter.html,
        });

        return { email: recipient.email, code, status: 'sent' };
      } catch (error) {
        consola.error(
          `[mailing] Не удалось отправить письмо на ${recipient.email}: ${getMailErrorMessage(error)}`,
        );

        return {
          email: recipient.email,
          code,
          status: 'failed',
          error: getMailErrorMessage(error),
        };
      }
    }

    const results: MailingSendResult[] = [];

    for (const [index, recipient] of recipients.entries()) {
      if (index > 0) {
        await delay(MAILING_SEND_DELAY_MS);
      }

      results.push(await processRecipient(recipient));
    }

    return { results };
  },
);
