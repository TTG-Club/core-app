import type { ComputedRef, MaybeRefOrGetter } from 'vue';

import { toValue } from 'vue';

import { ONE_YEAR_IN_SECONDS } from '#shared/consts';
import { SECTION_SPLIT_STORAGE_KEY } from '~/shared/consts';

/** Сколько ждать конца перетаскивания, прежде чем записать ширину, в мс. */
const SPLIT_SIZE_SAVE_DELAY = 300;

/** Ширина хранится с точностью до десятой доли процента. */
const SPLIT_SIZE_PRECISION = 10;

export interface UseSectionSplitSizeReturn {
  /** Запомненная ширина списка, в процентах; нет — не меняли */
  size: ComputedRef<number | undefined>;
  /** Запоминает ширину списка (с задержкой: при перетаскивании она меняется непрерывно) */
  saveSize: (value: number) => void;
}

/**
 * Проверяет, что в куке лежит объект ширин.
 *
 * @param value Значение куки.
 * @returns `true`, если это объект «раскладка → ширина».
 */
function isSizeRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Ширина списка широкого режима. В куке — чтобы сервер сразу отрисовал
 * колонки нужной ширины, без скачка после загрузки. У каждой раскладки своя
 * ширина: узкий список классов не сбивает ширину остальным разделам.
 *
 * @param splitId Под каким ключом ширина лежит в куке: раскладка списка
 *   (`SECTION_SPLIT_ID`, `SECTION_COMPACT_SPLIT_ID`, с приставкой узкой
 *   раскладки) или колонка фильтров (`SECTION_FILTERS_SPLIT_ID`).
 * @returns Запомненная ширина и её запись.
 */
export function useSectionSplitSize(
  splitId: MaybeRefOrGetter<string>,
): UseSectionSplitSizeReturn {
  const cookie = useCookie<unknown>(SECTION_SPLIT_STORAGE_KEY, {
    maxAge: ONE_YEAR_IN_SECONDS,
    default: () => ({}),
  });

  const size = computed(() => {
    const value = isSizeRecord(cookie.value)
      ? cookie.value[toValue(splitId)]
      : undefined;

    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : undefined;
  });

  const saveSize = useDebounceFn((value: number) => {
    cookie.value = {
      ...(isSizeRecord(cookie.value) ? cookie.value : {}),
      [toValue(splitId)]:
        Math.round(value * SPLIT_SIZE_PRECISION) / SPLIT_SIZE_PRECISION,
    };
  }, SPLIT_SIZE_SAVE_DELAY);

  return {
    size,
    saveSize: (value: number) => {
      saveSize(value);
    },
  };
}
