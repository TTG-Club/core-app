export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return;

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

  nuxtApp.provide('scrollbarWidth', () => {
    return readonly(scrollbarWidth) as Readonly<Ref<number>>;
  });

  function updateScrollbarWidth([window, body]: [number, number]) {
    const width = Math.max(window - body, 0);

    scrollbarWidth.value = width;

    document.documentElement.style.setProperty(
      '--scrollbar-width',
      `${width}px`,
    );
  }
});
