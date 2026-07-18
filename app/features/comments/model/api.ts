import type {
  CommentEntry,
  CommentRateLimitInfo,
  CommentsPage,
  CreateCommentRequest,
  PublicComment,
} from './types';

import { FetchError } from 'ofetch';

import {
  COMMENTS_API_PATH,
  COMMENTS_MODERATION_ALL_PATH,
  COMMENTS_PAGE_SIZE,
  COMMENTS_ROOT_SORT,
  COMMENTS_UNKNOWN_ERROR_MESSAGE,
  COMMENTS_USER_PAGE_SIZE,
} from './constants';
import {
  normalizeCommentContent,
  parseComment,
  parseCommentRateLimit,
  parseCommentReplies,
  parseCommentsCount,
  parseCreateCommentRequest,
  parseLatestComment,
  parseModerationCommentsPage,
  parsePublicComment,
  parsePublicCommentsPage,
} from './schemas';

/**
 * Достаёт HTTP-статус из ошибки `$fetch`.
 * @param error Пойманная ошибка.
 */
export function getCommentFetchStatus(error: unknown): number | undefined {
  if (error instanceof FetchError) {
    return error.statusCode ?? error.response?.status;
  }

  return undefined;
}

/**
 * Возвращает человекочитаемое сообщение об ошибке сервиса комментариев.
 * Сервис отвечает RFC 7807 ProblemDetail — готовый русский текст лежит
 * в поле `detail` (поля `message` в теле нет).
 * @param error Пойманная ошибка.
 */
export function getCommentErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    return (
      error.data?.detail
      || error.data?.message
      || error.message
      || COMMENTS_UNKNOWN_ERROR_MESSAGE
    );
  }

  return COMMENTS_UNKNOWN_ERROR_MESSAGE;
}

/**
 * Достаёт параметры антиспам-лимита из отказа 429: секунды до следующей
 * попытки (из тела ответа, при отсутствии — из заголовка `Retry-After`)
 * и флаг трёхчасовой блокировки.
 * @param error Пойманная ошибка.
 */
export function getCommentRateLimit(error: unknown): CommentRateLimitInfo {
  if (!(error instanceof FetchError)) {
    return { retryAfterSeconds: null, blocked: false };
  }

  const fromBody = parseCommentRateLimit(error.data);

  if (fromBody.retryAfterSeconds != null) {
    return fromBody;
  }

  const headerValue = error.response?.headers.get('retry-after');
  const headerSeconds = headerValue ? Number(headerValue) : Number.NaN;

  return {
    ...fromBody,
    retryAfterSeconds: Number.isFinite(headerSeconds) ? headerSeconds : null,
  };
}

/**
 * Страница корневых комментариев страницы, свежие сверху.
 * Кроме опубликованных сервис отдаёт надгробия — удалённые комментарии,
 * у которых остались живые ответы (см. `CommentEntry`); ответы приходят
 * отдельным запросом `fetchCommentReplies`.
 * @param section Раздел сайта в сервисе комментариев.
 * @param url URL страницы внутри раздела (ключ обсуждения).
 * @param page Номер страницы (с нуля).
 * @param size Размер страницы (по умолчанию — обычная лента).
 */
export async function fetchRootComments(
  section: string,
  url: string,
  page: number,
  size: number = COMMENTS_PAGE_SIZE,
): Promise<CommentsPage<PublicComment>> {
  const response = await $fetch(COMMENTS_API_PATH, {
    method: 'GET',
    query: {
      section,
      url,
      page,
      size,
      sort: COMMENTS_ROOT_SORT,
    },
    retry: 0,
  });

  return parsePublicCommentsPage(response);
}

/**
 * Число опубликованных комментариев страницы (вместе с ответами), поэтому
 * значение не совпадает с числом корней из пагинации.
 * @param section Раздел сайта в сервисе комментариев.
 * @param url URL страницы внутри раздела.
 */
export async function fetchCommentsCount(
  section: string,
  url: string,
): Promise<number> {
  const response = await $fetch(`${COMMENTS_API_PATH}/count`, {
    method: 'GET',
    query: { section, url },
    retry: 0,
  });

  return parseCommentsCount(response);
}

/**
 * Самый свежий опубликованный комментарий страницы, включая ответы —
 * для свёрнутого превью блока. Требует эндпоинта `/latest` (новые сборки
 * сервиса); вызывающий код при ошибке откатывается к последнему корню.
 * @param section Раздел сайта в сервисе комментариев.
 * @param url URL страницы внутри раздела.
 * @returns Комментарий либо `null`, если у страницы нет комментариев.
 */
export async function fetchLatestComment(
  section: string,
  url: string,
): Promise<PublicComment | null> {
  const response = await $fetch(`${COMMENTS_API_PATH}/latest`, {
    method: 'GET',
    query: { section, url },
    retry: 0,
  });

  return parseLatestComment(response);
}

/**
 * Один комментарий по идентификатору. Удалённый с живыми ответами приходит
 * надгробием, удалённый без них — 404 (как и несуществующий).
 * Используется для перехода по прямой ссылке: по `parentId` фронт
 * поднимается по цепочке предков до корня.
 * @param commentId Идентификатор комментария.
 */
export async function fetchCommentById(
  commentId: string,
): Promise<PublicComment> {
  const response = await $fetch(`${COMMENTS_API_PATH}/${commentId}`, {
    method: 'GET',
    retry: 0,
  });

  return parsePublicComment(response);
}

/**
 * Прямые ответы на комментарий — сервис отдаёт только один уровень,
 * глубже нужно спускаться отдельными запросами. Среди ответов могут быть
 * надгробия удалённых комментариев со своими живыми ветками.
 * @param parentId Идентификатор родительского комментария.
 */
export async function fetchCommentReplies(
  parentId: string,
): Promise<Array<PublicComment>> {
  const response = await $fetch(`${COMMENTS_API_PATH}/${parentId}/replies`, {
    method: 'GET',
    retry: 0,
  });

  return parseCommentReplies(response);
}

/**
 * Создаёт корневой комментарий от текущего пользователя.
 * @param request Раздел, URL страницы и текст.
 */
export async function createRootComment(
  request: CreateCommentRequest,
): Promise<CommentEntry> {
  const response = await $fetch(COMMENTS_API_PATH, {
    method: 'POST',
    body: parseCreateCommentRequest(request),
    retry: 0,
  });

  return parseComment(response);
}

/**
 * Создаёт ответ на опубликованный комментарий.
 * @param parentId Идентификатор родительского комментария.
 * @param request Раздел, URL страницы и текст.
 */
export async function createCommentReply(
  parentId: string,
  request: CreateCommentRequest,
): Promise<CommentEntry> {
  const response = await $fetch(`${COMMENTS_API_PATH}/${parentId}/replies`, {
    method: 'POST',
    body: parseCreateCommentRequest(request),
    retry: 0,
  });

  return parseComment(response);
}

/**
 * Изменяет текст своего комментария (409 — комментарий уже удалён).
 * @param commentId Идентификатор комментария.
 * @param content Новый текст.
 */
export async function updateComment(
  commentId: string,
  content: string,
): Promise<CommentEntry> {
  const response = await $fetch(`${COMMENTS_API_PATH}/${commentId}`, {
    method: 'PATCH',
    body: { content: normalizeCommentContent(content) },
    retry: 0,
  });

  return parseComment(response);
}

/**
 * Мягко удаляет свой комментарий. Ветка ответов при этом не прячется:
 * комментарий с живыми ответами остаётся в выдаче надгробием и исчезает
 * сам, когда удалят последний ответ под ним. Комментарий без ответов
 * пропадает из выдачи сразу.
 * @param commentId Идентификатор комментария.
 */
export async function deleteComment(commentId: string): Promise<void> {
  await $fetch(`${COMMENTS_API_PATH}/${commentId}`, {
    method: 'DELETE',
    retry: 0,
  });
}

/**
 * Страница комментариев одного автора из модерационной ленты — доступна
 * модератору и администратору. Фильтра по статусу у сервиса нет, поэтому
 * приходят и удалённые, и скрытые баном: делить их по вкладкам нужно на
 * клиенте. Сортировку сервис не принимает — лента всегда от новых к старым.
 * @param authorId UUID автора (тот же идентификатор, что и клейм `sub` в JWT).
 * @param page Номер страницы (с нуля).
 * @param size Размер страницы.
 */
export async function fetchUserComments(
  authorId: string,
  page: number,
  size: number = COMMENTS_USER_PAGE_SIZE,
): Promise<CommentsPage> {
  const response = await $fetch(COMMENTS_MODERATION_ALL_PATH, {
    method: 'GET',
    query: { authorId, page, size },
    retry: 0,
  });

  return parseModerationCommentsPage(response);
}

/**
 * Возвращает мягко удалённый комментарий в опубликованные (модератор, админ).
 * Восстанавливается только сам узел: ответы под ним остались опубликованными
 * и снова становятся видны вместе с ним. Комментарий в любом другом статусе —
 * 409; скрытие баном снимается разблокировкой автора в auth-service.
 * @param commentId Идентификатор комментария.
 */
export async function restoreComment(commentId: string): Promise<CommentEntry> {
  const response = await $fetch(`${COMMENTS_API_PATH}/${commentId}/restore`, {
    method: 'POST',
    retry: 0,
  });

  return parseComment(response);
}

/**
 * Отправляет жалобу на комментарий. Сервис принимает одну жалобу на
 * пользователя: повторная (или жалоба на удалённый комментарий) даёт 409.
 * @param commentId Идентификатор комментария.
 */
export async function reportComment(commentId: string): Promise<CommentEntry> {
  const response = await $fetch(`${COMMENTS_API_PATH}/${commentId}/dislike`, {
    method: 'POST',
    retry: 0,
  });

  return parseComment(response);
}
