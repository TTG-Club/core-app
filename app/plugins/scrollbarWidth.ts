export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) {
    return;
  }

  const scrollbarWidth = ref<number>(0);

  const { width: windowWidth } = useWindowSize({
    type: 'inner',
    includeScrollbar: true,
  });

  const { width: bodyWidth } = useElementSize(document.body);

  watchDebounced([windowWidth, bodyWidth], updateScrollbarWidth, {
    immediate: true,
    debounce: 100,
    maxWait: 500,
  });

  /*
   * Признак блокировки скролла для CSS. Библиотеки блокируют скролл по-разному и на разных элементах: Reka UI ставит инлайновый `overflow: hidden` на `body`, `useScrollLock(window)` из VueUse — на `html`. Завязывать стили на `[style*='overflow:hidden']` значит зашивать в CSS чужую реализацию, поэтому оба случая сводятся к одному собственному атрибуту на `html`.
   *
   * Перехватить сам вызов нельзя: Reka UI блокирует скролл изнутри Nuxt UI, наружу это не выведено. Поэтому за инлайновым стилем `html` и `body` следит наблюдатель за мутациями.
   *
   * Атрибут снимается, только когда `overflow: hidden` пропал у обоих элементов: при диалоге поверх меню навигации блокировки вложены, и снятие по первому же изменению вернуло бы сдвиг раньше времени.
   */
  useMutationObserver(
    [document.documentElement, document.body],
    updateScrollLockMarker,
    {
      attributes: true,
      attributeFilter: ['style'],
    },
  );

  updateScrollLockMarker();

  nuxtApp.provide('scrollbarWidth', () => {
    return readonly(scrollbarWidth) as Readonly<Ref<number>>;
  });

  function updateScrollbarWidth([window, body]: [number, number]) {
    const width = Math.max(window - body, 0);

    scrollbarWidth.value = width;

    /*
     * Имя намеренно отличается от `--scrollbar-width`: ту переменную Reka UI заводит на `html` сама при блокировке и удаляет при разблокировке (`useBodyScrollLock`). Под общим именем наше значение стиралось бы после первого же закрытого диалога, а вернуть его этот плагин не успевал бы — watcher дебаунсится, и при возврате размеров к прежним не срабатывает вовсе.
     */
    document.documentElement.style.setProperty(
      '--app-scrollbar-width',
      `${width}px`,
    );
  }

  function updateScrollLockMarker() {
    const isLocked = [document.documentElement, document.body].some(
      (element) => element.style.overflow === 'hidden',
    );

    document.documentElement.toggleAttribute('data-scroll-locked', isLocked);
  }
});
