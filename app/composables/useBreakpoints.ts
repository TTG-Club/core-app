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
  [Breakpoint.SM]: 576,
  [Breakpoint.MD]: 768,
  [Breakpoint.LG]: 992,
  [Breakpoint.XL]: 1200,
  [Breakpoint.XXL]: 1400,
};

export function useBreakpoints() {
  return useBreakpointsComposition(BREAKPOINTS);
}
