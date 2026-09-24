import { ARTICLES_ADMIN_ROUTE, getArticleRoute } from '../../model';

/**
 * Куда уводит «Закрыть» из редактора записи. Админ возвращается в список
 * админ-панели; модератору раздел `/admin/articles` закрыт (он может только
 * править), поэтому его возвращаем на страницу самой записи. У новой записи
 * url ещё нет — тогда тоже список.
 */
export function useArticleEditorCloseRoute(): ComputedRef<string> {
  const route = useRoute();
  const { isAdmin } = useUserRoles();

  return computed(() => {
    const url = route.params.url;

    return !isAdmin.value && typeof url === 'string' && url
      ? getArticleRoute(url)
      : ARTICLES_ADMIN_ROUTE;
  });
}
