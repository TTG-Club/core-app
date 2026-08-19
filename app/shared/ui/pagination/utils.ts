import type { PaginationLayout, PaginationSettings } from './types';

import {
  PAGINATION_ARROW_CONTROLS,
  PAGINATION_BASE_DIGITS,
  PAGINATION_DIGIT_WIDTH,
  PAGINATION_EDGE_CONTROLS,
  PAGINATION_EDGE_SLOTS,
  PAGINATION_ITEM_GAP,
  PAGINATION_ITEM_WIDTH,
  PAGINATION_LAYOUT_LADDER,
} from './constants';

/**
 * Ширина самой широкой кнопки пагинации: её задаёт номер последней страницы,
 * потому что с трёх разрядов подпись перестаёт умещаться в `min-w-5`.
 */
export function measurePaginationItemWidth(pageCount: number): number {
  const extraDigits = Math.max(
    0,
    String(pageCount).length - PAGINATION_BASE_DIGITS,
  );

  return PAGINATION_ITEM_WIDTH + extraDigits * PAGINATION_DIGIT_WIDTH;
}

/** Сколько кнопок помещается в контейнер заданной ширины. */
export function countFittingSlots(
  availableWidth: number,
  pageCount: number,
): number {
  const itemWidth = measurePaginationItemWidth(pageCount) + PAGINATION_ITEM_GAP;

  return Math.floor((availableWidth + PAGINATION_ITEM_GAP) / itemWidth);
}

/**
 * Сколько кнопок займёт раскладка: стрелки, края и окно из текущей страницы
 * с соседями. Список не может быть длиннее, чем самих страниц.
 */
export function countLayoutSlots(
  settings: PaginationSettings,
  pageCount: number,
): number {
  const controls =
    PAGINATION_ARROW_CONTROLS
    + (settings.showEdgeControls ? PAGINATION_EDGE_CONTROLS : 0);

  const windowSize = settings.siblingCount * 2 + 1;

  const listSize = settings.showEdges
    ? windowSize + PAGINATION_EDGE_SLOTS
    : windowSize;

  return controls + Math.min(listSize, pageCount);
}

/** Самая полная раскладка — та, что показывается, пока места хватает. */
function createWidestSettings(maxSiblingCount: number): PaginationSettings {
  return {
    siblingCount: maxSiblingCount,
    showEdges: true,
    showEdgeControls: true,
  };
}

/** Применяет ограничения раскладки к запрошенному числу соседей. */
function applyLayout(
  layout: PaginationLayout,
  maxSiblingCount: number,
): PaginationSettings {
  return {
    siblingCount: Math.min(maxSiblingCount, layout.maxSiblingCount),
    showEdges: layout.showEdges,
    showEdgeControls: layout.showEdgeControls,
  };
}

/**
 * Подбирает самую полную раскладку, которая влезает в контейнер.
 * Ширина `0` означает «ещё не измерили» (сервер, первый кадр) — тогда
 * показываем полную раскладку, а ужимаем уже после измерения.
 * Если не влезает даже самая компактная — отдаём её же, дальше сжимать нечего.
 */
export function resolvePaginationSettings(
  availableWidth: number,
  pageCount: number,
  maxSiblingCount: number,
): PaginationSettings {
  let settings = createWidestSettings(maxSiblingCount);

  if (availableWidth <= 0) {
    return settings;
  }

  const fittingSlots = countFittingSlots(availableWidth, pageCount);

  for (const layout of PAGINATION_LAYOUT_LADDER) {
    settings = applyLayout(layout, maxSiblingCount);

    if (countLayoutSlots(settings, pageCount) <= fittingSlots) {
      break;
    }
  }

  return settings;
}
