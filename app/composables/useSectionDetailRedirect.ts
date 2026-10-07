/**
 * Хелпер для детальных страниц [url].vue.
 * Автоматически перенаправляет на родительский список с query-параметром
 * detail, если активирован сплит-режим (Wide Mode).
 *
 * @param parentRouteName Имя роута родительского списка (например, 'spells', 'feats').
 */
export function useSectionDetailRedirect(parentRouteName: string) {
  const route = useRoute();
  const { isSplitActive } = useLayoutWidth();

  // Якорь сохраняется: deep-link на комментарий должен пережить редирект.
  // Query тоже: ссылка вида `/glossary/X?source=…` (так её пишет баг-репорт из
  // широкого режима) должна открыть список с теми же фильтрами и источниками.
  const splitLocation = {
    name: parentRouteName,
    query: { ...route.query, detail: route.params.url },
    hash: route.hash,
  };

  // Серверный redirect: если Wide Mode + десктоп,
  // сразу перенаправляем на список с query.detail
  if (import.meta.server && isSplitActive.value) {
    navigateTo(splitLocation, { replace: true, redirectCode: 302 });

    return;
  }

  watch(
    isSplitActive,
    (splitActive) => {
      if (splitActive) {
        navigateTo(splitLocation, { replace: true });
      }
    },
    { immediate: true },
  );
}
