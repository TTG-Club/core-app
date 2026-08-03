import { z } from 'zod';

import {
  MAILING_BODY_MAX_LENGTH,
  MAILING_CODE_PLACEHOLDER,
  MAILING_LABEL_MAX_LENGTH,
  MAILING_SUBJECT_MAX_LENGTH,
} from '#shared/consts';
import { REWARD_TIERS } from '~admin/subscriptions/model';

/**
 * Схема формы рассылки. Список получателей проверяется отдельно (разбор строки
 * с подсветкой ошибочных адресов), поэтому в схему не входит.
 */
export const mailingFormSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, 'Укажите тему письма')
    .max(MAILING_SUBJECT_MAX_LENGTH, 'Слишком длинная тема'),
  bodyText: z
    .string()
    .trim()
    .min(1, 'Напишите текст письма')
    .max(MAILING_BODY_MAX_LENGTH, 'Слишком длинное письмо')
    .refine(
      (value) => value.includes(MAILING_CODE_PLACEHOLDER),
      `Добавьте ${MAILING_CODE_PLACEHOLDER} — на это место подставится код`,
    ),
  rewardTier: z.enum(REWARD_TIERS),
  label: z
    .string()
    .trim()
    .max(MAILING_LABEL_MAX_LENGTH, 'Слишком длинное название'),
  recipients: z.string(),
});

/** Ответ сервера на отправку пачки писем. */
export const mailingSendResponseSchema = z.object({
  results: z.array(
    z.object({
      email: z.string(),
      code: z.string().nullable(),
      status: z.enum(['sent', 'failed']),
      error: z.string().optional(),
    }),
  ),
});
