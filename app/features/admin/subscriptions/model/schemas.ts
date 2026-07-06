import { z } from 'zod';

import {
  CODES_BATCH_MAX,
  CODES_BATCH_MIN,
  REWARD_PERKS,
  REWARD_TIERS,
  SUBSCRIPTION_MONTHS_MAX,
  SUBSCRIPTION_MONTHS_MIN,
  SUBSCRIPTION_TYPES,
} from './constants';

/**
 * Схема формы выпуска кодов. Только поле-уровневые правила (count 1..1000, срок >= 1).
 * Тир необязателен. Правило «код должен нести хотя бы что-то» проверяется отдельно
 * в onSubmit (тостом) и на бэкенде — чтобы не помечать поле тира как обязательное.
 */
export const createCodesSchema = z.object({
  rewardTier: z.enum(REWARD_TIERS).nullable(),
  includeSubscription: z.boolean(),
  subscriptionType: z.enum(SUBSCRIPTION_TYPES),
  subscriptionMonths: z
    .number()
    .int()
    .min(SUBSCRIPTION_MONTHS_MIN, `Минимум ${SUBSCRIPTION_MONTHS_MIN} мес.`)
    .max(SUBSCRIPTION_MONTHS_MAX, `Максимум ${SUBSCRIPTION_MONTHS_MAX} мес.`),
  perks: z.array(z.enum(REWARD_PERKS)),
  achievements: z.array(z.string()),
  count: z
    .number()
    .int()
    .min(CODES_BATCH_MIN, `Минимум ${CODES_BATCH_MIN} код`)
    .max(CODES_BATCH_MAX, `Максимум ${CODES_BATCH_MAX} кодов`),
  label: z.string().max(255, 'Слишком длинная метка'),
});
