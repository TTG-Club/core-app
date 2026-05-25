import type { MaybeRefOrGetter } from 'vue';

import type { LayoutWidth } from '~/shared/consts';

import { toValue } from 'vue';

import { LAYOUT_WIDTH_STORE_KEY, ONE_DAY_IN_SECONDS } from '#shared/consts';
import { LayoutWidthName } from '~/shared/consts';

import { useBreakpoints } from './useBreakpoints';

/**
 * Composable для управления шириной макета сайта.
 * Позволяет переключаться между стандартной и широкой шириной.
 * Широкая ширина активирует трехколоночный макет на больших экранах.
 */
export function useLayoutWidth() {
  const { isLgOrGreater } = useBreakpoints();

  const width = useCookie<LayoutWidth>(LAYOUT_WIDTH_STORE_KEY, {
    maxAge: ONE_DAY_IN_SECONDS * 365,
    default: () => LayoutWidthName.Default,
  });

  const isWide = computed(() => width.value === LayoutWidthName.Wide);

  const isSplitActive = computed(() => isWide.value && isLgOrGreater.value);

  /**
   * Изменение ширины макета.
   * @param value Новое значение ширины.
   */
  function change(value: MaybeRefOrGetter<LayoutWidth>) {
    const newWidth = toValue(value);

    if (!Object.values(LayoutWidthName).find((entry) => entry === newWidth)) {
      consola.warn(`Неизвестная ширина макета: ${newWidth}.`);

      return;
    }

    width.value = newWidth;
  }

  /**
   * Переключение между стандартной и широкой шириной.
   */
  function toggle() {
    width.value =
      width.value === LayoutWidthName.Default
        ? LayoutWidthName.Wide
        : LayoutWidthName.Default;
  }

  return {
    width,
    isWide,
    isSplitActive,
    change,
    toggle,
  };
}
