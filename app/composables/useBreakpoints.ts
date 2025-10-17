import { useBreakpoints as useBreakpointsComposition } from '@vueuse/core';

/**
 * SM: 576px,
 * MD: 768px,
 * LG: 992px,
 * XL: 1200px,
 * XXL: 1400px,
 */
export const enum Breakpoint {
  /**
   * 576px
   */
  SM = 'SM',
  /**
   * 768px
   */
  MD = 'MD',
  /**
   * 992px
   */
  LG = 'LG',
  /**
   * 1200px
   */
  XL = 'XL',
  /**
   * 1400px
   */
  XXL = 'XXL',
}

/**
 * [Breakpoint.SM]: 576px,
 * [Breakpoint.MD]: 768px,
 * [Breakpoint.LG]: 992px,
 * [Breakpoint.XL]: 1200px,
 * [Breakpoint.XXL]: 1400px,
 */
export const BREAKPOINTS: Record<Breakpoint, number> = {
  [Breakpoint.SM]: 640,
  [Breakpoint.MD]: 768,
  [Breakpoint.LG]: 1024,
  [Breakpoint.XL]: 1280,
  [Breakpoint.XXL]: 1536,
};

export function useBreakpoints() {
  const composition = useBreakpointsComposition(BREAKPOINTS);

  const isMobile = computed(() => unref(composition.smaller(Breakpoint.MD)));

  const isTablet = computed(() =>
    unref(composition.greaterOrEqual(Breakpoint.MD)),
  );

  const isDesktop = computed(() =>
    unref(composition.greaterOrEqual(Breakpoint.LG)),
  );

  const isMobileOrTablet = computed(() =>
    unref(composition.smaller(Breakpoint.XL)),
  );

  const isXsOrLower = computed(() => unref(composition.smaller(Breakpoint.SM)));

  const isSmOrGreater = computed(() =>
    unref(composition.greaterOrEqual(Breakpoint.SM)),
  );

  const isMdOrGreater = computed(() =>
    unref(composition.greaterOrEqual(Breakpoint.MD)),
  );

  const isLgOrGreater = computed(() =>
    unref(composition.greaterOrEqual(Breakpoint.LG)),
  );

  const isXlOrGreater = computed(() =>
    unref(composition.greaterOrEqual(Breakpoint.XL)),
  );

  const isXxlOrGreater = computed(() =>
    unref(composition.greaterOrEqual(Breakpoint.XXL)),
  );

  return {
    ...composition,
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    isXsOrLower,
    isSmOrGreater,
    isMdOrGreater,
    isLgOrGreater,
    isXlOrGreater,
    isXxlOrGreater,
  };
}
