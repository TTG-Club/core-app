import { z as validation } from 'zod';

import {
  PUBLICATION_DEFAULT_PLATFORM,
  PUBLICATION_IMAGE_MAX_LENGTH,
  PUBLICATION_IMAGE_PATTERN,
  PUBLICATION_LEGACY_MAX_GAMES,
  PUBLICATION_MAX_CHANNELS,
  PUBLICATION_MAX_GENRES_LENGTH,
  PUBLICATION_MAX_HISTORY,
  PUBLICATION_MAX_SLOTS,
  PUBLICATION_TELEGRAM_ID_LIMIT,
  PUBLICATION_TELEGRAM_ID_PATTERN,
  PUBLICATION_TEXT,
  PUBLICATION_VK_ID_PATTERN,
} from './constants';

/** Путь картинки из загрузки сайта — тот же, что принимает сервис игр. */
const publicationImageSchema = validation
  .string()
  .max(PUBLICATION_IMAGE_MAX_LENGTH)
  .regex(PUBLICATION_IMAGE_PATTERN, PUBLICATION_TEXT.invalidImage);

export const publicationPlatformSchema = validation.enum([
  'DISCORD',
  'TELEGRAM',
  'VK',
]);

const telegramChatIdSchema = validation
  .string()
  .regex(
    PUBLICATION_TELEGRAM_ID_PATTERN,
    PUBLICATION_TEXT.invalidTelegramChatId,
  )
  .refine(
    (chatId) => Number(chatId) >= PUBLICATION_TELEGRAM_ID_LIMIT,
    PUBLICATION_TEXT.invalidTelegramChatId,
  );

const publicationSlotDraftSchema = validation.object({
  day: validation.number(),
  time: validation.string(),
});

export const publicationSlotSchema = publicationSlotDraftSchema.extend({
  day: validation.number().int().min(1).max(7),
  time: validation
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, PUBLICATION_TEXT.invalidTime),
});
export const publicationScheduleSchema = validation
  .array(publicationSlotSchema)
  .max(PUBLICATION_MAX_SLOTS)
  .refine(
    (slots) =>
      new Set(slots.map((slot) => `${slot.day}:${slot.time}`)).size
      === slots.length,
    PUBLICATION_TEXT.invalidSchedule,
  );
export const publicationSettingsFormSchema = validation
  .object({
    enabled: validation.boolean(),
    schedule: publicationScheduleSchema,
    revision: validation.number().int().nonnegative(),
  })
  .refine((settings) => !settings.enabled || settings.schedule.length > 0, {
    path: ['schedule'],
    message: PUBLICATION_TEXT.invalidSchedule,
  });

const webhookSchema = validation
  .string()
  .regex(
    /^https:\/\/discord\.com\/api(?:\/v10)?\/webhooks\/\d{17,20}\/[\w-]{40,200}$/,
    PUBLICATION_TEXT.invalidWebhook,
  );

export const publicationChannelFormSchema = validation
  .object({
    name: validation
      .string()
      .trim()
      .min(1, PUBLICATION_TEXT.nameRequired)
      .max(100),
    platform: publicationPlatformSchema,
    telegramChatId: validation.string().trim(),
    vkGroupId: validation.string().trim(),
    // Сервис подставит сообщество из VK_GROUP_ID, если поле ID нового канала пустое.
    vkGroupDefault: validation.boolean().default(false),
    enabled: validation.boolean(),
    inherit: validation.boolean(),
    webhookUrl: validation
      .string()
      .trim()
      .pipe(validation.union([webhookSchema, validation.literal('')])),
    schedule: validation.array(publicationSlotDraftSchema),
    revision: validation.number().int().nonnegative(),
    isNew: validation.boolean(),
    // Путь картинки из загрузки сайта; пустая строка — пост без картинки.
    imageUrl: validation
      .string()
      .trim()
      .pipe(validation.union([publicationImageSchema, validation.literal('')]))
      .default(''),
  })
  .refine(
    (channel) =>
      channel.platform !== 'DISCORD'
      || !channel.isNew
      || channel.webhookUrl.length > 0,
    {
      path: ['webhookUrl'],
      message: PUBLICATION_TEXT.invalidWebhook,
    },
  )
  .superRefine((channel, validationContext) => {
    if (
      channel.platform === 'TELEGRAM'
      && (channel.isNew || channel.telegramChatId)
    ) {
      const chatId = telegramChatIdSchema.safeParse(channel.telegramChatId);

      if (!chatId.success) {
        validationContext.addIssue({
          code: 'custom',
          path: ['telegramChatId'],
          message: PUBLICATION_TEXT.invalidTelegramChatId,
        });
      }
    }

    if (
      channel.platform === 'VK'
      && (channel.vkGroupId || (channel.isNew && !channel.vkGroupDefault))
      && !PUBLICATION_VK_ID_PATTERN.test(channel.vkGroupId)
    ) {
      validationContext.addIssue({
        code: 'custom',
        path: ['vkGroupId'],
        message: PUBLICATION_TEXT.invalidVkGroupId,
      });
    }

    if (channel.inherit) {
      return;
    }

    const schedule = publicationScheduleSchema
      .min(1, PUBLICATION_TEXT.invalidSchedule)
      .safeParse(channel.schedule);

    if (!schedule.success) {
      for (const issue of schedule.error.issues) {
        validationContext.addIssue({
          ...issue,
          path: ['schedule', ...issue.path],
        });
      }
    }
  });
export const publicationChannelSchema = validation.object({
  // Ответ прежнего API подтверждён: такие каналы всегда относятся к Discord.
  platform: publicationPlatformSchema.default(PUBLICATION_DEFAULT_PLATFORM),
  id: validation.uuid(),
  name: validation.string().min(1).max(100),
  enabled: validation.boolean(),
  schedule: publicationScheduleSchema.nullable(),
  revision: validation.number().int().nonnegative(),
  nextRunAt: validation.iso.datetime().nullable(),
  // Прежний API картинку не возвращает: такие каналы публикуются без неё.
  imageUrl: publicationImageSchema.nullable().default(null),
});
export const publicationOverviewSchema = validation.object({
  settings: validation.object({
    enabled: validation.boolean(),
    schedule: publicationScheduleSchema,
    revision: validation.number().int().nonnegative(),
    pausedUntil: validation.iso.datetime().nullable(),
  }),
  channels: validation
    .array(publicationChannelSchema)
    .max(PUBLICATION_MAX_CHANNELS),
  configured: validation.boolean(),
  telegramConfigured: validation.boolean().default(false),
  vkConfigured: validation.boolean().default(false),
  vkGroupConfigured: validation.boolean().default(false),
  timeZone: validation.literal('Europe/Moscow'),
});
export const publicationPreviewSchema = validation
  .array(
    validation
      .object({
        id: validation.uuid(),
        title: validation.string(),
        system: validation.string(),
        genreSummary: validation.string().max(PUBLICATION_MAX_GENRES_LENGTH),
        takenSeats: validation.number().int().nonnegative(),
        maxPlayers: validation.number().int().positive(),
        url: validation
          .url()
          .refine((address) => address.startsWith('https://')),
      })
      .refine((game) => game.takenSeats <= game.maxPlayers),
  )
  .max(PUBLICATION_LEGACY_MAX_GAMES);
export const publicationHistorySchema = validation
  .array(
    validation.object({
      platform: publicationPlatformSchema.default(PUBLICATION_DEFAULT_PLATFORM),
      id: validation.uuid(),
      channelName: validation.string(),
      scheduledAt: validation.iso.datetime(),
      status: validation.enum([
        'SENDING',
        'SENT',
        'RETRY',
        'FAILED',
        'UNKNOWN',
        'SKIPPED',
      ]),
      gameCount: validation.number().int().nonnegative(),
      detail: validation.string(),
      messageId: validation.string().nullable(),
    }),
  )
  .max(PUBLICATION_MAX_HISTORY);
export const publicationFailureSchema = validation.object({
  statusCode: validation.number().optional(),
  status: validation.number().optional(),
});
export const publicationTestResultSchema = validation.object({
  status: validation.enum(['SENT', 'FAILED', 'UNKNOWN', 'SKIPPED']),
  detail: validation.string(),
});

/** Читает только проверенный HTTP-статус, не раскрывая содержимое ошибки. */
export function getPublicationFailureStatus(
  exception: unknown,
): number | undefined {
  const parsed = publicationFailureSchema.safeParse(exception);

  return parsed.success
    ? (parsed.data.statusCode ?? parsed.data.status)
    : undefined;
}

/** Проверяет ответ сервиса до передачи в интерфейс. */
export function parsePublicationOverview(
  response: unknown,
): validation.infer<typeof publicationOverviewSchema> {
  return publicationOverviewSchema.parse(response);
}
/** Проверяет публичную подборку перед отображением. */
export function parsePublicationPreview(
  response: unknown,
): validation.infer<typeof publicationPreviewSchema> {
  return publicationPreviewSchema.parse(response);
}
/** Проверяет журнал отправок. */
export function parsePublicationHistory(
  response: unknown,
): validation.infer<typeof publicationHistorySchema> {
  return publicationHistorySchema.parse(response);
}
