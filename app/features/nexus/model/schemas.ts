import type {
  Nexus,
  NexusMember,
  NexusPage,
  NexusSheet,
  NexusTracker,
} from './types';

import { z } from '~/utils/zod';

/**
 * Момент времени от сервиса. Jackson отдаёт `Instant` строкой, но при иной
 * настройке — числом; принимаем оба, чтобы лента не разваливалась молча.
 * @param value Сырое значение из ответа сервиса.
 */
function normalizeInstant(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  return '';
}

/**
 * `.optional()` обязателен: `z.unknown()` с `transform` внутри объекта
 * считается обязательным ключом, а сервис их опускает — `@JsonInclude(NON_NULL)`
 * вырезает код приглашения у гостя и игру у самостоятельной комнаты.
 */
const instantSchema = z.unknown().optional().transform(normalizeInstant);

const idSchema = z.string().min(1);

const nexusSchema = z.object({
  id: idSchema,
  title: z.string().catch(''),
  ownerId: idSchema,
  inviteCode: z.string().nullish().catch(null),
  gameId: z.string().nullish().catch(null),
  owner: z.boolean().catch(false),
  memberCount: z.number().int().nonnegative().catch(0),
  createdAt: instantSchema,
  updatedAt: instantSchema,
});

const nexusMemberSchema = z.object({
  userId: idSchema,
  owner: z.boolean().catch(false),
  joinedAt: instantSchema,
});

const nexusPageSchema = z.object({
  content: z.array(z.unknown()).catch([]),
  totalElements: z.number().catch(0),
  totalPages: z.number().catch(0),
  number: z.number().catch(0),
  size: z.number().catch(0),
  first: z.boolean().catch(true),
  last: z.boolean().catch(true),
});

/**
 * Приводит комнату к доменному виду.
 * @param parsed Результат разбора ответа сервиса.
 */
function toNexus(parsed: z.infer<typeof nexusSchema>): Nexus {
  return {
    id: parsed.id,
    title: parsed.title,
    ownerId: parsed.ownerId,
    inviteCode: parsed.inviteCode ?? null,
    gameId: parsed.gameId ?? null,
    owner: parsed.owner,
    memberCount: parsed.memberCount,
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
  };
}

/**
 * Разбирает одну комнату.
 * @param input Сырой ответ сервиса.
 */
export function parseNexus(input: unknown): Nexus {
  return toNexus(nexusSchema.parse(input));
}

/**
 * Разбирает страницу комнат, отсеивая битые записи поштучно: одна испорченная
 * комната не должна прятать весь список.
 * @param input Сырой ответ сервиса.
 */
export function parseNexusPage(input: unknown): NexusPage {
  const page = nexusPageSchema.parse(input);

  const content = page.content.flatMap((item) => {
    const result = nexusSchema.safeParse(item);

    return result.success ? [toNexus(result.data)] : [];
  });

  return {
    content,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    number: page.number,
    size: page.size,
    first: page.first,
    last: page.last,
  };
}

/**
 * Разбирает состав комнаты.
 * @param input Сырой массив из ответа сервиса.
 */
export function parseNexusMembers(input: unknown): Array<NexusMember> {
  const items = z.array(z.unknown()).catch([]).parse(input);

  return items.flatMap((item) => {
    const result = nexusMemberSchema.safeParse(item);

    return result.success ? [result.data] : [];
  });
}

const nexusSheetSchema = z.object({
  id: idSchema,
  ownerId: idSchema,
  shareToken: z.string().min(1),
  characterName: z.string().catch(''),
  canRemove: z.boolean().catch(false),
  createdAt: instantSchema,
});

/**
 * Разбирает листы комнаты, отсеивая битые записи поштучно: один испорченный
 * лист не должен прятать весь стол.
 * @param input Сырой массив из ответа сервиса.
 */
export function parseNexusSheets(input: unknown): Array<NexusSheet> {
  const items = z.array(z.unknown()).catch([]).parse(input);

  return items.flatMap((item) => {
    const result = nexusSheetSchema.safeParse(item);

    return result.success ? [result.data] : [];
  });
}

/**
 * Разбирает один лист комнаты.
 * @param input Сырой ответ сервиса.
 */
export function parseNexusSheet(input: unknown): NexusSheet {
  return nexusSheetSchema.parse(input);
}

const nexusTrackerSchema = z.object({
  id: idSchema,
  trackerId: idSchema,
  title: z.string().catch(''),
  createdBy: idSchema,
  canRemove: z.boolean().catch(false),
  createdAt: instantSchema,
});

/**
 * Разбирает трекеры комнаты, отсеивая битые записи поштучно.
 * @param input Сырой массив из ответа сервиса.
 */
export function parseNexusTrackers(input: unknown): Array<NexusTracker> {
  const items = z.array(z.unknown()).catch([]).parse(input);

  return items.flatMap((item) => {
    const result = nexusTrackerSchema.safeParse(item);

    return result.success ? [result.data] : [];
  });
}

/**
 * Разбирает один трекер комнаты.
 * @param input Сырой ответ сервиса.
 */
export function parseNexusTracker(input: unknown): NexusTracker {
  return nexusTrackerSchema.parse(input);
}
