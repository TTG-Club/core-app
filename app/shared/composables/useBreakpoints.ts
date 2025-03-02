import { useBreakpoints as useBreakpointsComposition } from '@vueuse/core';

/**
 * XS: 0px,
 * SM: 576px,
 * MD: 768px,
 * LG: 992px,
 * XL: 1200px,
 * XXL: 1400px,
 * FULL_HD: 1920px,
 * RETINA: 2560px,
 * ULTRA_HD: 3840px,
 */
export const enum Breakpoint {
  /**
   * 0px
   */
  XS = 'XS',
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
  /**
   * 1920px
   */
  FULL_HD = 'FULL_HD',
  /**
   * 2560px
   */
  RETINA = 'RETINA',
  /**
   * 3840px
   */
  ULTRA_HD = 'ULTRA_HD',
}

/**
 * [Breakpoint.XS]: 0px,
 * [Breakpoint.SM]: 576px,
 * [Breakpoint.MD]: 768px,
 * [Breakpoint.LG]: 992px,
 * [Breakpoint.XL]: 1200px,
 * [Breakpoint.XXL]: 1400px,
 * [Breakpoint.FULL_HD]: 1920px,
 * [Breakpoint.RETINA]: 2560px,
 * [Breakpoint.ULTRA_HD]: 3840px,
 */
export const BREAKPOINTS: Record<Breakpoint, number> = {
  [Breakpoint.XS]: 0,
  [Breakpoint.SM]: 576,
  [Breakpoint.MD]: 768,
  [Breakpoint.LG]: 992,
  [Breakpoint.XL]: 1200,
  [Breakpoint.XXL]: 1400,
  [Breakpoint.FULL_HD]: 1920,
  [Breakpoint.RETINA]: 2560,
  [Breakpoint.ULTRA_HD]: 3840,
};

export function useBreakpoints() {
  return useBreakpointsComposition(BREAKPOINTS);
}
