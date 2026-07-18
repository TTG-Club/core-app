import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { restoreCommentsByAuthor } from '#server/utils/commentsAdminService';

const restoreCommentsParamsSchema = z.object({
  authorId: z.string().uuid(),
});

/**
 * Возвращает комментарии автора, скрытые баном (HIDDEN_BY_BAN → PUBLISHED),
 * через internal API comments-service. Доступно только администратору.
 */
export default defineEventHandler(async (event) => {
  const parsedParams = restoreCommentsParamsSchema.safeParse(
    getRouterParams(event),
  );

  if (!parsedParams.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  return await restoreCommentsByAuthor(event, parsedParams.data.authorId);
});
