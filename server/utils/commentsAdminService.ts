import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { parseAuthJwtPayload } from '#server/utils/authService';
import { Role } from '~/shared/types';

/** Заголовок межсервисной авторизации internal API comments-service. */
const COMMENTS_SERVICE_TOKEN_HEADER = 'X-Service-Token';

/** Базовый путь internal-эндпоинтов comments-service. */
const COMMENTS_INTERNAL_PATH = '/api/v1/internal/comments';

const COMMENTS_SERVICE_TOKEN_MISSING_MESSAGE =
  'Межсервисный токен comments-service не настроен (NITRO_COMMENTS_SERVICE_TOKEN)';

/** Результат массовой операции над комментариями автора. */
const affectedCommentsSchema = z.object({
  affected: z.number().int().nonnegative(),
});

export type AffectedCommentsResponse = z.infer<typeof affectedCommentsSchema>;

/**
 * Проверяет, что запрос выполняет администратор. Internal-эндпоинты
 * comments-service авторизуются общим сервисным токеном, а не JWT
 * пользователя, поэтому роль проверяется здесь — до подстановки токена.
 */
async function assertAdminRequest(event: H3Event): Promise<void> {
  const token = getTokenFromRequest(event);
  const tokenPayload = parseAuthJwtPayload(await verifyJwt(token));

  if (!tokenPayload.roles.includes(Role.ADMIN)) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }
}

/**
 * Вызывает internal-эндпоинт comments-service с межсервисным токеном
 * от имени текущего администратора.
 */
async function fetchCommentsInternalService(
  event: H3Event,
  path: string,
  authorId: string,
): Promise<AffectedCommentsResponse> {
  await assertAdminRequest(event);

  const { url, serviceToken } = getCommentsSecrets();

  if (!serviceToken) {
    throw createError(
      getErrorResponse(StatusCodes.SERVICE_UNAVAILABLE, {
        message: COMMENTS_SERVICE_TOKEN_MISSING_MESSAGE,
      }),
    );
  }

  let response: unknown;

  try {
    response = await $fetch<unknown>(
      `${url}${COMMENTS_INTERNAL_PATH}/${path}`,
      {
        method: 'POST',
        body: { authorId },
        headers: { [COMMENTS_SERVICE_TOKEN_HEADER]: serviceToken },
      },
    );
  } catch (error) {
    return handleFetchError(
      '[comments-admin]',
      `Ошибка запроса к comments-service: ${path}`,
      error,
    );
  }

  return affectedCommentsSchema.parse(response);
}

/**
 * Скрывает все опубликованные комментарии автора (PUBLISHED → HIDDEN_BY_BAN).
 * Текст сохраняется, восстановление возвращает комментарии как есть.
 */
export async function hideCommentsByAuthor(
  event: H3Event,
  authorId: string,
): Promise<AffectedCommentsResponse> {
  return await fetchCommentsInternalService(event, 'hide-by-author', authorId);
}

/**
 * Возвращает комментарии автора, скрытые баном (HIDDEN_BY_BAN → PUBLISHED).
 * Удалённые пользователем или модератором остаются нетронутыми.
 */
export async function restoreCommentsByAuthor(
  event: H3Event,
  authorId: string,
): Promise<AffectedCommentsResponse> {
  return await fetchCommentsInternalService(
    event,
    'restore-by-author',
    authorId,
  );
}
