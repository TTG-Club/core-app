export default defineNuxtRouteMiddleware(() => {
  const nuxtApp = useNuxtApp();

  if (!import.meta.client || nuxtApp.isHydrating) {
    return;
  }

  const overlay = useOverlay();

  overlay.closeAll();
});
