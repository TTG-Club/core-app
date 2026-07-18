import type {
  CommentEntry,
  CommentRateLimitInfo,
  CommentsPage,
  CreateCommentRequest,
} from './types';

import { z } from '~/utils/zod';

import {
  COMMENT_CONTENT_MAX_LENGTH,
  COMMENT_SECTION_MAX_LENGTH,
  COMMENT_URL_MAX_LENGTH,
} from './constants';

/**
 * Приводит дату сервиса к ISO-строке. Jackson может сериализовать дату
 * ISO-строкой, epoch-числом (миллисекунды) или массивом
 * `[год, месяц 1-12, день, час, минута, секунда, наносекунды?]`.
 * Непригодное значение превращается в пустую строку (дата скрывается),
 * а его форма пишется в консоль — чтобы формат бэка не терялся молча.
 */
function normalizeCommentDate(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  if (
    Array.isArray(value)
    && value.length >= 3
    && value.every((element) => typeof element === 'number')
  ) {
    const [year = 0, month = 1, day = 1, hour = 0, minute = 0, second = 0] =
      value;

    if (!year) {
      return '';
    }

    // Наносекунды (7-й элемент) отбрасываются; дата трактуется как UTC.
    return new Date(
      Date.UTC(year, month - 1, day, hour, minute, second),
    ).toISOString();
  }

  if (value != null) {
    consola.warn('[comments] Неизвестный формат даты от сервиса:', value);
  }

  return '';
}

/** Дата сервиса в любом формате Jackson, нормализованная к ISO-строке. */
const commentDateSchema = z.unknown().transform(normalizeCommentDate);

/**
 * Схема комментария. Поля снабжены `catch`-дефолтами, чтобы битое поле не
 * роняло всю ленту. Исключение — `id`: без него комментарий бесполезен.
 */
const commentSchema = z.object({
  id: z.string().min(1),
  // Принадлежность треду: на экране может жить несколько блоков сразу
  // (страница + дровер), по этим полям отсекаются чужие deep-link'и.
  section: z.string().nullish().catch(null),
  url: z.string().nullish().catch(null),
  parentId: z.string().nullish().catch(null),
  authorId: z.string().catch(''),
  authorName: z.string().catch(''),
  content: z.string().catch(''),
  status: z
    .enum([
      'PUBLISHED',
      'DELETED',
      'PENDING_MODERATION',
      'REJECTED',
      'SPAM',
      'HIDDEN_BY_BAN',
    ])
    .catch('PUBLISHED'),
  replyCount: z.coerce.number().catch(0),
  // Опциональные поля новых сборок сервиса — отсутствие не ломает разбор.
  totalReplyCount: z.coerce.number().nullish().catch(null),
  parentAuthorName: z.string().nullish().catch(null),
  dislikeCount: z.coerce.number().catch(0),
  createdAt: commentDateSchema,
  editedAt: commentDateSchema.nullable().catch(null),
});

/**
 * Разбирает массив комментариев, отсеивая битые записи поштучно и сообщая о
 * каждой в консоль. Важно именно поэлементно: `catch` на самом массиве отдал
 * бы пустую выдачу целиком из-за одного комментария без `id` — на экране это
 * выглядит как «комментариев нет» при непустом счётчике.
 * @param input Сырой массив из ответа сервиса.
 */
function parseCommentList(
  input: unknown,
): Array<z.infer<typeof commentSchema>> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    const parsed = commentSchema.safeParse(item);

    if (!parsed.success) {
      consola.warn('[comments] Комментарий не прошёл разбор:', item);

      return [];
    }

    return [parsed.data];
  });
}

/** Схема страницы Spring-пагинации корневых комментариев. */
const commentsPageSchema = z.object({
  content: z.unknown().transform(parseCommentList),
  totalElements: z.coerce.number().catch(0),
  last: z.boolean().catch(true),
});

const commentsCountSchema = z.coerce.number().catch(0);

/**
 * Текст комментария: сервер ввод не валидирует (пустая строка даёт 500,
 * пробельная — пустой «пузырь»), поэтому нормализуем и проверяем на фронте.
 */
const commentContentSchema = z
  .string()
  .trim()
  .min(1)
  .max(COMMENT_CONTENT_MAX_LENGTH);

/** Схема тела создания комментария с лимитами сервиса на `section` и `url`. */
const createCommentRequestSchema = z.object({
  section: z.string().trim().min(1).max(COMMENT_SECTION_MAX_LENGTH),
  url: z.string().trim().min(1).max(COMMENT_URL_MAX_LENGTH),
  content: commentContentSchema,
});

/**
 * Приводит разобранный zod-объект к доменному типу с нормализованными null.
 */
function toCommentEntry(parsed: z.infer<typeof commentSchema>): CommentEntry {
  return {
    ...parsed,
    section: parsed.section ?? null,
    url: parsed.url ?? null,
    parentId: parsed.parentId ?? null,
    totalReplyCount: parsed.totalReplyCount ?? null,
    parentAuthorName: parsed.parentAuthorName ?? null,
    editedAt: parsed.editedAt ?? null,
  };
}

/**
 * Валидирует один комментарий из ответа сервиса (создание, правка, жалоба).
 * @param input Сырой ответ сервера.
 */
export function parseComment(input: unknown): CommentEntry {
  return toCommentEntry(commentSchema.parse(input));
}

/**
 * Валидирует ответ `/latest`: комментарий либо `null`, если у страницы
 * ещё нет комментариев (сервис может ответить пустым телом/204).
 * @param input Сырой ответ сервера.
 */
export function parseLatestComment(input: unknown): CommentEntry | null {
  if (input == null || input === '') {
    return null;
  }

  return toCommentEntry(commentSchema.parse(input));
}

/**
 * Валидирует страницу корневых комментариев.
 * @param input Сырой ответ сервера.
 */
export function parseCommentsPage(input: unknown): CommentsPage {
  const parsed = commentsPageSchema.parse(input);

  return {
    items: parsed.content.map(toCommentEntry),
    totalElements: parsed.totalElements,
    last: parsed.last,
  };
}

/**
 * Валидирует список прямых ответов и сортирует их от старых к новым,
 * чтобы ветка читалась хронологически.
 * @param input Сырой ответ сервера.
 */
export function parseCommentReplies(input: unknown): Array<CommentEntry> {
  return parseCommentList(input)
    .map(toCommentEntry)
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

/**
 * Валидирует счётчик комментариев страницы (учитывает и ответы).
 * @param input Сырой ответ сервера.
 */
export function parseCommentsCount(input: unknown): number {
  return commentsCountSchema.parse(input);
}

/** Схема тела отказа 429 антиспам-лимита (RFC 7807 + поля лимита). */
const commentRateLimitSchema = z
  .object({
    retryAfterSeconds: z.coerce.number().nullish().catch(null),
    blocked: z.boolean().catch(false),
  })
  .catch({ retryAfterSeconds: null, blocked: false });

/**
 * Валидирует параметры антиспам-лимита из тела отказа 429 — битое или
 * чужое тело превращается в «параметры неизвестны».
 * @param input Сырое тело ответа.
 */
export function parseCommentRateLimit(input: unknown): CommentRateLimitInfo {
  const parsed = commentRateLimitSchema.parse(input);

  return {
    retryAfterSeconds: parsed.retryAfterSeconds ?? null,
    blocked: parsed.blocked,
  };
}

/**
 * Нормализует (трим) и валидирует текст комментария перед отправкой.
 * @param content Текст из формы.
 */
export function normalizeCommentContent(content: string): string {
  return commentContentSchema.parse(content);
}

/**
 * Нормализует и валидирует тело создания комментария перед отправкой.
 * @param request Данные формы.
 */
export function parseCreateCommentRequest(
  request: CreateCommentRequest,
): CreateCommentRequest {
  return createCommentRequestSchema.parse(request);
}
