const COMMENTS_NAME_SYNC_API_PATH = '/api/user/comments/sync-name';

/**
 * Синхронизация имени автора в комментариях с текущим отображаемым именем.
 * Best-effort и fire-and-forget: зовётся после смены имени и после публикации
 * комментария; ошибки проглатываются — на пользовательский поток не влияет.
 */
export function useCommentsNameSync() {
  function syncCommentsName(): void {
    void $fetch(COMMENTS_NAME_SYNC_API_PATH, { method: 'POST' }).catch(
      () => {},
    );
  }

  return { syncCommentsName };
}
