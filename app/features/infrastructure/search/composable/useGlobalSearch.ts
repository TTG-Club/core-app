/**
 * Палитра поиска грузится отдельным чанком при первом открытии: вместе с ней
 * приходят нечёткий поиск (fuse.js) и список команд, а кнопка поиска стоит в
 * сайдбаре каждой страницы.
 */
const SearchPalette = defineAsyncComponent(() =>
  import('../palette').then((paletteModule) => paletteModule.SearchPalette),
);

/**
 * Управляет палитрой глобального поиска.
 *
 * `createSharedComposable` обязателен: `overlay.create` на каждый вызов заводит
 * оверлей с новым `id`, а палитра должна быть одна на всех потребителей — пока
 * смонтирован хотя бы один из них. По размонтировании последнего scope
 * останавливается, и следующий вызов заведёт новый оверлей.
 */
export const useGlobalSearch = createSharedComposable(() => {
  const overlay = useOverlay();
  const modal = overlay.create(SearchPalette);

  const isOpen = computed(() => {
    if (import.meta.server) {
      return false;
    }

    return overlay.isOpen(modal.id);
  });

  function open() {
    if (isOpen.value) {
      return;
    }

    modal.open();
  }

  function close() {
    modal.close();
  }

  return {
    isOpen,

    close,
    open,
  };
});
