import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { AnchorScrollOptions } from '~/shared/types';

function executeScroll(route: RouteLocationNormalizedLoaded) {
  const { scrollToAnchor, scrollToTop } = useAnchorScroll();

  const anchorScrollProps = route.meta.anchorScroll ?? {};

  const { toAnchor: disableToAnchor = false, toTop: disableToTop = false } =
    anchorScrollProps.disabled === true
      ? { toAnchor: true, toTop: true }
      : (anchorScrollProps.disabled ?? {});

  if (disableToAnchor && disableToTop) return;

  const customOptions = route.meta.anchorScroll;

  // Скролл к якорю
  if (!disableToAnchor && route.hash) {
    const options: AnchorScrollOptions | undefined = customOptions?.toAnchor;
    const success = scrollToAnchor(route.hash, options);

    if (success) return;
  }

  // Скролл наверх
  if (!disableToTop) {
    const options: AnchorScrollOptions | undefined = customOptions?.toTop;

    scrollToTop(options);
  }
}

export default defineNuxtPlugin(({ hook }) => {
  hook('page:finish', () => {
    const router = useRouter();

    executeScroll(router.currentRoute.value);
  });

  return {
    provide: {
      anchorScroll: useAnchorScroll(),
    },
  };
});
