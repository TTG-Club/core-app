/** Заголовок межсервисной авторизации internal API comments-service. */
const COMMENTS_SERVICE_TOKEN_HEADER = 'X-Service-Token';

/** Internal-эндпоинт массового переименования автора в comments-service. */
const COMMENTS_RENAME_PATH = '/api/v1/internal/comments/rename-by-author';

/**
 * Best-effort: просит comments-service привести имя автора во ВСЕХ его комментариях
 * к текущему отображаемому имени (по `authorId` = `sub` токена). Вызывается после
 * смены имени и после публикации комментария.
 *
 * Ошибки и отсутствие межсервисного токена (`NITRO_COMMENTS_SERVICE_TOKEN`) не
 * пробрасываются — синхронизация имени не должна ронять пользовательский поток.
 * Возвращает `true`, если запрос ушёл успешно.
 */
export async function renameCommentsAuthor(
  authorId: string,
  displayName: string,
): Promise<boolean> {
  const { url, serviceToken } = getCommentsSecrets();

  if (!serviceToken) {
    return false;
  }

  try {
    await $fetch(`${url}${COMMENTS_RENAME_PATH}`, {
      body: { authorId, displayName },
      headers: {
        [COMMENTS_SERVICE_TOKEN_HEADER]: serviceToken,
      },
      method: 'POST',
    });

    return true;
  } catch (error) {
    consola.warn(
      '[comments-rename] Не удалось обновить имя автора в комментариях:',
      error,
    );

    return false;
  }
}
