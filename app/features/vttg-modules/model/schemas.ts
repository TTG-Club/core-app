import type {
  ModuleSubmission,
  SubmissionRequest,
  SubmissionsPage,
  VttgGameSystem,
} from './types';

import { z } from 'zod';

import {
  MODERATION_COMMENT_MAX_LENGTH,
  SUBMISSION_DESCRIPTION_MAX_LENGTH,
  SUBMISSION_STATUSES,
  SUBMISSION_URL_MAX_LENGTH,
} from './constants';

const gameSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const moduleSubmissionSchema = z.object({
  id: z.string(),
  status: z.enum(SUBMISSION_STATUSES),
  authorId: z.string(),
  authorName: z.string().nullable(),
  repositoryUrl: z.string(),
  manifestUrl: z.string(),
  description: z.string(),
  systemIds: z.array(z.string()),
  module: z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    author: z.string().nullable(),
    icon: z.string().nullable(),
    downloadUrl: z.string(),
    manifest: z.string(),
    syncedAt: z.string(),
  }),
  moderation: z
    .object({
      moderatorId: z.string().nullable(),
      comment: z.string().nullable(),
      reviewedAt: z.string(),
    })
    .nullable(),
  linksLocked: z.boolean(),
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Страница Spring Data в формате `VIA_DTO`: метаданные лежат в `page`. */
const submissionsPageSchema = z.object({
  content: z.array(moduleSubmissionSchema),
  page: z.object({
    totalElements: z.number(),
  }),
});

const problemDetailSchema = z.object({
  title: z.string().nullish(),
  detail: z.string().nullish(),
});

/** Проверяет заявку до отправки: те же ограничения, что у сервиса. */
export const submissionRequestSchema = z.object({
  manifestUrl: z.string().trim().min(1).max(SUBMISSION_URL_MAX_LENGTH),
  description: z.string().trim().min(1).max(SUBMISSION_DESCRIPTION_MAX_LENGTH),
});

/** Проверяет комментарий модератора до отправки. */
export const moderationCommentSchema = z
  .string()
  .trim()
  .max(MODERATION_COMMENT_MAX_LENGTH);

/**
 * Разбирает справочник игровых систем.
 * @param input Сырой ответ сервиса.
 */
export function parseGameSystems(input: unknown): Array<VttgGameSystem> {
  return z.array(gameSystemSchema).parse(input);
}

/**
 * Разбирает одну заявку.
 * @param input Сырой ответ сервиса.
 */
export function parseSubmission(input: unknown): ModuleSubmission {
  return moduleSubmissionSchema.parse(input);
}

/**
 * Разбирает список заявок автора.
 * @param input Сырой ответ сервиса.
 */
export function parseSubmissions(input: unknown): Array<ModuleSubmission> {
  return z.array(moduleSubmissionSchema).parse(input);
}

/**
 * Разбирает страницу очереди модерации.
 * @param input Сырой ответ сервиса.
 */
export function parseSubmissionsPage(input: unknown): SubmissionsPage {
  const parsed = submissionsPageSchema.parse(input);

  return {
    content: parsed.content,
    totalElements: parsed.page.totalElements,
  };
}

/**
 * Достаёт из тела отказа готовый русский текст. Тело может быть чем угодно
 * (пустым, HTML от прокси), поэтому разбор не бросает.
 * @param input Сырое тело ответа с ошибкой.
 */
export function parseProblemMessage(input: unknown): string | null {
  const parsed = problemDetailSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return parsed.data.detail || parsed.data.title || null;
}

/**
 * Готовит заявку к отправке: обрезает пробелы и проверяет длины.
 * @param request Данные формы.
 */
export function prepareSubmissionRequest(
  request: SubmissionRequest,
): SubmissionRequest {
  return submissionRequestSchema.parse(request);
}
