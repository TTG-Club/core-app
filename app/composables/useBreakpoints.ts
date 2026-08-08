import { useBreakpoints as useBreakpointsComposition } from '@vueuse/core';

/**
 * XS: 480px,
 * SM: 640px,
 * MD: 768px,
 * LG: 1024px,
 * XL: 1280px,
 * XXL: 1536px,
 */
export const enum Breakpoint {
  /**
   * 480px
   */
  XS = 'XS',
  /**
   * 640px
   */
  SM = 'SM',
  /**
   * 768px
   */
  MD = 'MD',
  /**
   * 1024px
   */
  LG = 'LG',
  /**
   * 1280px
   */
  XL = 'XL',
  /**
   * 1536px
   */
  XXL = 'XXL',
}

/**
 * [Breakpoint.XS]: 480px,
 * [Breakpoint.SM]: 640px,
 * [Breakpoint.MD]: 768px,
 * [Breakpoint.LG]: 1024px,
 * [Breakpoint.XL]: 1280px,
 * [Breakpoint.XXL]: 1536px,
 */
export const BREAKPOINTS: Record<Breakpoint, number> = {
  [Breakpoint.XS]: 480,
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

  const isXsOrLower = computed(() => unref(composition.smaller(Breakpoint.XS)));

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
