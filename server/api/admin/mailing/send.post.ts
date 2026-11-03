import type { MailingSendResponse, MailingSendResult } from '#shared/types';

import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { assertAdminRole } from '#server/utils/getUser';
import {
  assertMailerConfigured,
  getMailErrorMessage,
  getMailingSiteUrl,
  sendCampaignMail,
} from '#server/utils/mailer';
import { renderCampaignLetter } from '#server/utils/mailingTemplate';
import { fetchSubscriberAdminService } from '#server/utils/subscriberAdminService';
import {
  CODE_ACHIEVEMENT_MAX_LENGTH,
  CODE_CONTENT_LIST_MAX,
  MAILING_BODY_MAX_LENGTH,
  MAILING_CHUNK_SIZE,
  MAILING_LABEL_MAX_LENGTH,
  MAILING_SEND_DELAY_MS,
  MAILING_SUBJECT_MAX_LENGTH,
  SUBSCRIPTION_MONTHS_MAX,
  SUBSCRIPTION_MONTHS_MIN,
} from '#shared/consts';
import { applyMailingPlaceholders, buildMailingCodeLabel } from '#shared/utils';

/** Эндпоинт выпуска кодов в subscriber-service. */
const SUBSCRIPTION_CODES_PATH = '/api/subscriptions/codes';

/** Ответ subscriber-service на выпуск пачки кодов (нужен только сам код). */
const createdCodesSchema = z
  .array(z.object({ code: z.string().min(1) }))
  .min(1);

/** Значение перечисления subscriber-service: тир, тип подписки, перк. */
const enumValueSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/);

const sendMailingSchema = z.object({
  subject: z.string().trim().min(1).max(MAILING_SUBJECT_MAX_LENGTH),
  bodyText: z.string().trim().min(1).max(MAILING_BODY_MAX_LENGTH),
  // Содержимое кода — как в форме выпуска кодов. Точные наборы тиров, перков и
  // типов подписки валидирует subscriber-service — здесь достаточно формы,
  // чтобы не разъезжаться с бэкендом при появлении новых значений.
  rewardTier: z
    .string()
    .regex(/^TIER_\d+$/, 'Некорректный тир')
    .optional(),
  subscriptionType: enumValueSchema.optional(),
  subscriptionMonths: z
    .number()
    .int()
    .min(SUBSCRIPTION_MONTHS_MIN)
    .max(SUBSCRIPTION_MONTHS_MAX)
    .optional(),
  perks: z.array(enumValueSchema).max(CODE_CONTENT_LIST_MAX).optional(),
  achievements: z
    .array(z.string().trim().min(1).max(CODE_ACHIEVEMENT_MAX_LENGTH))
    .max(CODE_CONTENT_LIST_MAX)
    .optional(),
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

/** Содержимое выпускаемого кода — то же тело, что у формы выпуска кодов. */
type CodeContent = Pick<
  SendMailingRequest,
  | 'rewardTier'
  | 'subscriptionType'
  | 'subscriptionMonths'
  | 'perks'
  | 'achievements'
>;

/**
 * Несёт ли код хоть что-то. Пустой код subscriber-service не выпустит, а
 * подписка без типа или срока — некорректна.
 *
 * @param content содержимое кода
 */
function isValidCodeContent(content: CodeContent): boolean {
  const hasSubscription = !!content.subscriptionMonths;

  if (hasSubscription !== !!content.subscriptionType) {
    return false;
  }

  return (
    !!content.rewardTier
    || hasSubscription
    || !!content.perks?.length
    || !!content.achievements?.length
  );
}

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
 * Выпускает один код с заданным содержимым и возвращает его строковое значение.
 *
 * @param event событие запроса
 * @param content содержимое кода
 * @param label метка кода (в неё попадает адрес получателя)
 */
async function issueCode(
  event: Parameters<typeof fetchSubscriberAdminService>[0],
  content: CodeContent,
  label: string,
): Promise<string> {
  const created = await fetchSubscriberAdminService<unknown>(
    event,
    SUBSCRIPTION_CODES_PATH,
    {
      method: 'POST',
      body: {
        ...content,
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
 * с заданным содержимым (тир, подписка, перки, достижения — как в форме выпуска
 * кодов) и уходит отдельное письмо.
 *
 * Получатели приходят маленькими пачками (см. `MAILING_CHUNK_SIZE`), внутри
 * пачки письма уходят по одному с паузой. Ошибка по одному адресу не отменяет
 * остальные — каждая строка отчёта возвращается со своим статусом, поэтому
 * администратор видит, кому код уже ушёл, и может повторить только неудачные.
 */
export default defineEventHandler(
  async (event): Promise<MailingSendResponse> => {
    await assertAdminRole(event);

    const parsedBody = sendMailingSchema.safeParse(await readBody(event));

    if (!parsedBody.success) {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

    // До выпуска кодов: без рабочего SMTP рассылку начинать нельзя, иначе коды
    // сгорят впустую.
    assertMailerConfigured();

    const { subject, bodyText, label, recipients, ...content } =
      parsedBody.data;

    // Повтор неудачных шлёт уже выпущенные коды — содержимое нужно только для новых.
    const needsNewCodes = recipients.some((recipient) => !recipient.code);

    if (needsNewCodes && !isValidCodeContent(content)) {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

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
            content,
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
