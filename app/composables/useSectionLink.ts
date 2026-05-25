/**
 * Хелпер для компонентов ссылок в списочных разделах.
 * Управляет переключением между drawer-режимом и query.detail-режимом
 * в зависимости от активности сплит-макета (Wide Mode).
 *
 * @param itemUrl URL элемента (идентификатор в списке).
 * @param drawerId Идентификатор overlay-экземпляра drawer.
 * @param openDrawer Функция открытия drawer.
 */
export function useSectionLink(
  itemUrl: string,
  drawerId: symbol,
  openDrawer: () => void,
) {
  const route = useRoute();
  const router = useRouter();
  const { isSplitActive } = useLayoutWidth();
  const overlay = useOverlay();

  const detailParentUrl = useState<string | undefined>(
    'section-detail-parent-url',
    () => undefined,
  );

  const isOpened = computed(() => {
    if (isSplitActive.value) {
      return (
        route.query.detail === itemUrl || detailParentUrl.value === itemUrl
      );
    }

    if (import.meta.server) {
      return false;
    }

    return overlay.isOpen(drawerId);
  });

  /**
   * Обработчик открытия элемента.
   * В сплит-режиме обновляет query-параметр detail.
   * В обычном режиме открывает drawer.
   */
  function handleOpen() {
    if (isSplitActive.value) {
      router.push({
        query: {
          ...route.query,
          detail: itemUrl,
        },
      });

      return;
    }

    openDrawer();
  }

  return {
    isOpened,
    handleOpen,
  };
}
