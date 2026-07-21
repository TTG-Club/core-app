import { parseAuthJwtPayload } from '#server/utils/authService';

/**
 * Приводит имя автора в комментариях к текущему отображаемому имени пользователя.
 * Дёргается фронтом после смены имени и после публикации комментария (новый
 * комментарий стамперит логин из токена — этот вызов заменяет его на имя).
 *
 * Всё best-effort: без `sub` в токене, без имени в core-api или без межсервисного
 * токена просто возвращаем `synced: false`, не роняя запрос.
 */
export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event);
  const tokenPayload = parseAuthJwtPayload(await verifyJwt(token));

  const authorId = tokenPayload.sub;

  if (!authorId) {
    return { synced: false };
  }

  const displayName = await fetchUserDisplayName(token);

  if (!displayName) {
    return { synced: false };
  }

  const synced = await renameCommentsAuthor(authorId, displayName);

  return { synced };
});
