import type { ComputedRef } from 'vue';

import {
  ONE_YEAR_IN_SECONDS,
  SECTION_CENTERED_STORE_KEY,
  SECTION_DETAIL_EXPANDED_STORE_KEY,
} from '#shared/consts';

import { useLayoutWidth } from './useLayoutWidth';

export interface UseSectionCenteredReturn {
  /** Выбрана узкая раскладка с записью рядом */
  isCentered: ComputedRef<boolean>;
  /** Узкая раскладка действует: выбрана и сейчас широкий режим */
  isCenteredInSplit: ComputedRef<boolean>;
  /** Запись развёрнута на всю ширину колонки поверх списка */
  isDetailExpanded: ComputedRef<boolean>;
  /** Включает или выключает узкую раскладку */
  setCentered: (value: boolean) => void;
  /** Разворачивает запись или возвращает список рядом */
  toggleDetailExpanded: () => void;
}

/**
 * Узкая раскладка разделов, как на старом сайте 5e14: страница стоит
 * колонкой по центру, пока запись не открыта — список во всю её ширину, с
 * записью — список слева, запись справа на том же месте. Запись можно
 * развернуть на всю колонку. Работает поверх широкого режима: запись так же
 * открывается в адресе через `?detail=`. В куке — чтобы сервер сразу отдал
 * нужную раскладку.
 *
 * @returns Состояние раскладки и его переключатели.
 */
export function useSectionCentered(): UseSectionCenteredReturn {
  const { isSplitActive } = useLayoutWidth();

  const cookieOptions = {
    maxAge: ONE_YEAR_IN_SECONDS,
    default: () => false,
  };

  const centeredCookie = useCookie<unknown>(
    SECTION_CENTERED_STORE_KEY,
    cookieOptions,
  );

  const expandedCookie = useCookie<unknown>(
    SECTION_DETAIL_EXPANDED_STORE_KEY,
    cookieOptions,
  );

  // В куку может попасть что угодно — включено только явное `true`
  const isCentered = computed(() => centeredCookie.value === true);
  const isDetailExpanded = computed(() => expandedCookie.value === true);

  const isCenteredInSplit = computed(
    () => isSplitActive.value && isCentered.value,
  );

  return {
    isCentered,
    isCenteredInSplit,
    isDetailExpanded,
    setCentered: (value) => {
      centeredCookie.value = value;
    },
    toggleDetailExpanded: () => {
      expandedCookie.value = !isDetailExpanded.value;
    },
  };
}
