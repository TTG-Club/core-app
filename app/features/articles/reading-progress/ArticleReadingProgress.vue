<script setup lang="ts">
  /**
   * Полоска прочитанного над страницей статьи: сколько страницы уже
   * прокручено. Считается по окну, поэтому ставится только на отдельную
   * страницу статьи, а не в панель или дровер.
   */
  const { y: scrollTop } = useWindowScroll();
  const { height: windowHeight } = useWindowSize();
  const isMounted = useMounted();

  // Доля прокрученной страницы. Высоту документа браузер не отдаёт
  // реактивно — она перечитывается при каждой прокрутке и смене размера окна.
  // До монтирования — ноль, как на сервере, чтобы гидратация совпала.
  const progress = computed(() => {
    if (!isMounted.value) {
      return 0;
    }

    const scrollable =
      document.documentElement.scrollHeight - windowHeight.value;

    return scrollable > 0 ? Math.min(scrollTop.value / scrollable, 1) : 0;
  });

  const barStyle = computed(() => ({
    transform: `scaleX(${progress.value})`,
  }));
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
    aria-hidden="true"
  >
    <div
      class="h-full origin-left bg-primary"
      :style="barStyle"
    />
  </div>
</template>
