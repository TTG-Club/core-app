// Количество колонок по умолчанию для обычной и виртуальной сетки.
export const GROUPED_LIST_DEFAULT_COLUMNS = 3;

// Число строк, которые дорисовываются за пределами видимой области.
export const GROUPED_LIST_DEFAULT_OVERSCAN = 10;

// Минимальное количество элементов, после которого включается виртуализация.
export const GROUPED_LIST_DEFAULT_VIRTUAL_THRESHOLD = 120;

// Высота одной строки карточек в виртуальном списке.
export const GROUPED_LIST_DEFAULT_ROW_HEIGHT = 72;

// Высота разделителя группы в виртуальном списке (21px линия + 16px отступ снизу pb-4).
export const GROUPED_LIST_DEFAULT_SEPARATOR_HEIGHT = 31;

// Отступ сверху для разделителей, которые идут не первыми (визуальный зазор от предыдущего списка).
export const GROUPED_LIST_DEFAULT_SEPARATOR_TOP_OFFSET = 18;

// Отступ от нижней границы экрана для расчета видимой области.
export const GROUPED_LIST_DEFAULT_BOTTOM_OFFSET = 32;

// Ширины контейнера, при которых увеличивается количество колонок.
export const GROUPED_LIST_COLUMN_BREAKPOINTS = [
  { width: 448, columns: 2 },
  { width: 576, columns: 3 },
  { width: 896, columns: 4 },
  { width: 1152, columns: 5 },
  { width: 1280, columns: 6 },
];

// Tailwind-классы сетки, соответствующие количеству активных колонок.
export const GROUPED_LIST_GRID_CLASSES = [
  'grid-cols-1',
  '@md:grid-cols-2',
  '@xl:grid-cols-3',
  '@4xl:grid-cols-4',
  '@6xl:grid-cols-5',
  '@7xl:grid-cols-6',
];
