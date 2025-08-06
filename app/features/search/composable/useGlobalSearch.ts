import { SearchPalette } from '~search/palette';

export const useGlobalSearch = () => {
  const overlay = useOverlay();
  const modal = overlay.create(SearchPalette);

  const isOpen = computed(() => overlay.isOpen(modal.id));

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
};
