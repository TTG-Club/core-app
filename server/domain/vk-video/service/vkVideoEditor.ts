import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';

import { assertAdminAccess } from '#server/utils/getUser';

/**
 * Пропускает только тех, кто правит записи с роликами (администратор,
 * модератор), и отдаёт их имя: подключение ВК у каждого своё.
 *
 * @param event запрос
 * @returns имя пользователя сайта
 */
export async function getVkVideoEditor(event: H3Event): Promise<string> {
  const user = await getUserFromToken(event);

  assertAdminAccess(user);

  if (!user.username) {
    throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }

  return user.username;
}
