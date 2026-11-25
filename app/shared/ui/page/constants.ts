/**
 * Классы самой узкой сетки по числу колонок. Две — для плиток с обложкой: в
 * одну колонку обложка во всю ширину телефона выходит огромной.
 */
export const PAGE_GRID_NARROWEST_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
} as const;

/** Колонок на самом узком контейнере, сколько допускает сетка. */
export type PageGridMinColumns = keyof typeof PAGE_GRID_NARROWEST_CLASSES;

/** По умолчанию на самом узком контейнере одна колонка. */
export const PAGE_GRID_DEFAULT_MIN_COLUMNS: PageGridMinColumns = 1;
