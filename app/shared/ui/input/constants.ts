/** Подписи и иконки поля с выбором из библиотеки. */
export const LIBRARY_PICKER_LABELS = {
  /** Подпись кнопки выбора — для подсказки и экранного чтеца. */
  picker: 'Из библиотеки',
  /** Подсказка поля поиска по библиотеке. */
  searchPlaceholder: 'Поиск…',
} as const;

/** Иконки поля с выбором из библиотеки. */
export const LIBRARY_PICKER_ICONS = {
  picker: 'tabler:books',
  search: 'tabler:search',
} as const;

/** Число разделов, при котором заголовки разделов не нужны: раздел один. */
export const SINGLE_LIBRARY_SECTION_COUNT = 1;
