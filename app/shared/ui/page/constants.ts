/**
 * С какой ширины контейнера плитки встают в две колонки, px. Уже — плитка в
 * половину ширины выходит такой узкой, что название не читается, и плитки
 * идут в одну колонку. Совпадает с `@min-[18.75rem]` в классах ниже.
 */
export const PAGE_GRID_TWO_COLUMNS_MIN_WIDTH = 300;

/**
 * Классы самой узкой сетки по числу колонок. Две — для плиток с обложкой: в
 * одну колонку обложка во всю ширину телефона выходит огромной; но на совсем
 * узком контейнере (меньше `PAGE_GRID_TWO_COLUMNS_MIN_WIDTH`) — всё же одна.
 */
export const PAGE_GRID_NARROWEST_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 @min-[18.75rem]:grid-cols-2',
} as const;

/** Колонок на самом узком контейнере, сколько допускает сетка. */
export type PageGridMinColumns = keyof typeof PAGE_GRID_NARROWEST_CLASSES;

/** По умолчанию на самом узком контейнере одна колонка. */
export const PAGE_GRID_DEFAULT_MIN_COLUMNS: PageGridMinColumns = 1;
