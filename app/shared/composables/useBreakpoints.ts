import { useBreakpoints as useBreakpointsComposition } from '@vueuse/core';

export function useBreakpoints() {
  return useBreakpointsComposition({
    'xs': 0,
    'sm': 576,
    'md': 768,
    'lg': 992,
    'xl': 1200,
    'xxl': 1400,
    'full-hd': 1920,
    'retina': 2560,
    'ultra-hd': 3840,
  });
}
