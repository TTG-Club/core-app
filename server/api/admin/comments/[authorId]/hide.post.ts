import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { hideCommentsByAuthor } from '#server/utils/commentsAdminService';

const hideCommentsParamsSchema = z.object({
  authorId: z.string().uuid(),
});

/**
 * Скрывает все опубликованные комментарии автора (HIDDEN_BY_BAN) через
 * internal API comments-service. Доступно только администратору.
 */
export default defineEventHandler(async (event) => {
  const parsedParams = hideCommentsParamsSchema.safeParse(
    getRouterParams(event),
  );

  if (!parsedParams.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  return await hideCommentsByAuthor(event, parsedParams.data.authorId);
});
