import type { PaginationLayout } from './types';

/**
 * Ширина одной кнопки пагинации (`size=md`, `square`) в пикселях: иконка или
 * подпись шириной 20px (`min-w-5`) плюс паддинги `p-1.5` с двух сторон.
 * Двузначные номера страниц в эти 20px укладываются.
 */
export const PAGINATION_ITEM_WIDTH = 32;

/**
 * Прибавка к ширине кнопки за каждый разряд номера страницы сверх двух:
 * начиная с трёхзначных номеров подпись перерастает `min-w-5`.
 */
export const PAGINATION_DIGIT_WIDTH = 9;

/** Разрядность номера, которая укладывается в базовую ширину кнопки. */
export const PAGINATION_BASE_DIGITS = 2;

/** Промежуток между кнопками — `gap-1` из темы Nuxt UI. */
export const PAGINATION_ITEM_GAP = 4;

/** Сколько соседних номеров показываем вокруг текущего на широком экране. */
export const PAGINATION_SIBLING_COUNT = 1;

/** Кнопки «назад» и «вперёд», которые есть в любой раскладке. */
export const PAGINATION_ARROW_CONTROLS = 2;

/** Кнопки «в начало» и «в конец» — они же дополнительные к стрелкам. */
export const PAGINATION_EDGE_CONTROLS = 2;

/**
 * Сколько слотов добавляют края списка (`show-edges`): первая и последняя
 * страницы плюс два многоточия.
 */
export const PAGINATION_EDGE_SLOTS = 4;

/**
 * Лесенка ужимания — от самой полной раскладки к самой компактной.
 * Первыми уходят кнопки «в начало»/«в конец»: их роль уже играют номера первой
 * и последней страниц. Затем сокращаются соседние номера, и только в самом
 * узком контейнере пропадают края — без них остаётся окно вокруг текущей
 * страницы.
 */
export const PAGINATION_LAYOUT_LADDER: ReadonlyArray<PaginationLayout> = [
  {
    maxSiblingCount: Number.POSITIVE_INFINITY,
    showEdges: true,
    showEdgeControls: true,
  },
  {
    maxSiblingCount: Number.POSITIVE_INFINITY,
    showEdges: true,
    showEdgeControls: false,
  },
  { maxSiblingCount: 0, showEdges: true, showEdgeControls: false },
  { maxSiblingCount: 1, showEdges: false, showEdgeControls: false },
  { maxSiblingCount: 0, showEdges: false, showEdgeControls: false },
];

/**
 * Классы, которыми прячутся кнопки «в начало»/«в конец»: Nuxt UI переключает
 * пропом `show-controls` все четыре контрола разом, а стрелки нужны всегда.
 */
export const PAGINATION_HIDDEN_EDGE_CONTROLS = {
  first: 'hidden',
  last: 'hidden',
} as const;
