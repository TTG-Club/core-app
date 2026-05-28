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

  const splitLocation = {
    name: parentRouteName,
    query: { detail: route.params.url },
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
