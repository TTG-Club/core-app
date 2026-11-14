import type { ComputedRef } from 'vue';

import {
  ONE_YEAR_IN_SECONDS,
  SECTION_FILTERS_COLLAPSED_STORE_KEY,
} from '#shared/consts';

import { useLayoutWidth } from './useLayoutWidth';
import { useSectionCentered } from './useSectionCentered';

export interface UseSectionFiltersCollapsedReturn {
  /** Пользователь свернул колонку фильтров */
  isCollapsed: ComputedRef<boolean>;
  /** Фильтры строкой над списком: колонка свёрнута или выбрана узкая раскладка (широкий режим) */
  isCollapsedInSplit: ComputedRef<boolean>;
  /** Сворачивает или разворачивает колонку фильтров */
  setCollapsed: (value: boolean) => void;
}

/**
 * Свёрнута ли колонка фильтров разделов. В широком режиме свёрнутая колонка
 * уступает место списку и записи, а поиск и кнопки фильтров встают строкой
 * над списком. В куке — чтобы сервер сразу отдал нужную раскладку.
 *
 * @returns Состояние колонки и его переключатель.
 */
export function useSectionFiltersCollapsed(): UseSectionFiltersCollapsedReturn {
  const { isSplitActive } = useLayoutWidth();
  const { isCentered } = useSectionCentered();

  const cookie = useCookie<unknown>(SECTION_FILTERS_COLLAPSED_STORE_KEY, {
    maxAge: ONE_YEAR_IN_SECONDS,
    default: () => false,
  });

  // В куку может попасть что угодно — «свёрнуто» только явное `true`.
  const isCollapsed = computed(() => cookie.value === true);

  // В узкой раскладке колонки фильтров нет: они всегда строкой над списком
  const isCollapsedInSplit = computed(
    () => isSplitActive.value && (isCollapsed.value || isCentered.value),
  );

  /**
   * Запоминает выбор пользователя.
   *
   * @param value `true` — свернуть колонку.
   */
  function setCollapsed(value: boolean): void {
    cookie.value = value;
  }

  return { isCollapsed, isCollapsedInSplit, setCollapsed };
}
