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

  watch(
    isSplitActive,
    (splitActive) => {
      if (splitActive) {
        navigateTo(
          {
            name: parentRouteName,
            query: { detail: route.params.url },
          },
          { replace: true },
        );
      }
    },
    { immediate: true },
  );
}
