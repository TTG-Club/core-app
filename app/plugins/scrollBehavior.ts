import type { Router } from 'vue-router';

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) {
    return;
  }

  const router = nuxtApp.$router as Router;
  const scrollPositions = ref<Record<string, number>>({});

  useEventListener(window, 'scroll', saveScrollPosition);

  router.options.scrollBehavior = (to, from, savedPosition) => {
    if (to.hash) {
      return false;
    }

    if (savedPosition) {
      return { top: savedPosition.top ?? 0 };
    }

    return { top: 0 };
  };

  function saveScrollPosition() {
    const path = router.currentRoute.value.path ?? '';

    scrollPositions.value[path] = window.scrollY;
  }
});
