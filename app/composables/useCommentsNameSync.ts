const COMMENTS_NAME_SYNC_API_PATH = '/api/user/comments/sync-name';

/**
 * Просит бэкенд привести имя автора во всех комментариях пользователя к его
 * текущему отображаемому имени. Best-effort и fire-and-forget: ошибки
 * проглатываются — на пользовательский поток не влияет.
 */
function syncCommentsName(): void {
  void $fetch(COMMENTS_NAME_SYNC_API_PATH, { method: 'POST' }).catch(() => {});
}

/**
 * Синхронизация имени автора в комментариях. Зовётся после смены имени и после
 * публикации комментария.
 */
export function useCommentsNameSync() {
  return { syncCommentsName };
}
