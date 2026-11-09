import type { ComputedRef } from 'vue';

import {
  ONE_YEAR_IN_SECONDS,
  SECTION_DETAIL_SIDE_STORE_KEY,
  SECTION_FILTERS_SIDE_STORE_KEY,
} from '#shared/consts';

/** Сторона колонки в широком режиме. */
export type SectionColumnSide = 'left' | 'right';

export interface UseSectionColumnSidesReturn {
  /** С какой стороны колонка фильтров */
  filtersSide: ComputedRef<SectionColumnSide>;
  /** С какой стороны от списка карточка записи */
  detailSide: ComputedRef<SectionColumnSide>;
  /** Переставляет колонку фильтров */
  setFiltersSide: (side: SectionColumnSide) => void;
  /** Переставляет карточку записи */
  setDetailSide: (side: SectionColumnSide) => void;
}

/**
 * Читает сторону из куки: всё, кроме известного значения, — сторона по
 * умолчанию.
 *
 * @param value Значение куки.
 * @param fallback Сторона по умолчанию.
 * @returns Сторона колонки.
 */
function toSide(
  value: unknown,
  fallback: SectionColumnSide,
): SectionColumnSide {
  return value === 'left' || value === 'right' ? value : fallback;
}

/**
 * Порядок колонок широкого режима: фильтры слева или справа, запись справа
 * или слева от списка. Один на все разделы. В куке — чтобы сервер сразу
 * отдал колонки по местам.
 *
 * @returns Стороны колонок и их смена.
 */
export function useSectionColumnSides(): UseSectionColumnSidesReturn {
  const cookieOptions = {
    maxAge: ONE_YEAR_IN_SECONDS,
    default: () => undefined,
  };

  const filtersCookie = useCookie<unknown>(
    SECTION_FILTERS_SIDE_STORE_KEY,
    cookieOptions,
  );

  const detailCookie = useCookie<unknown>(
    SECTION_DETAIL_SIDE_STORE_KEY,
    cookieOptions,
  );

  const filtersSide = computed(() => toSide(filtersCookie.value, 'left'));
  const detailSide = computed(() => toSide(detailCookie.value, 'right'));

  return {
    filtersSide,
    detailSide,
    setFiltersSide: (side) => {
      filtersCookie.value = side;
    },
    setDetailSide: (side) => {
      detailCookie.value = side;
    },
  };
}
