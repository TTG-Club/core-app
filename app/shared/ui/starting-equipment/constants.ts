/** Подписи строки стартового снаряжения. */
export const STARTING_EQUIPMENT_TEXT = {
  /** «Выберите А или Б: …» — начало строки, когда вариантов несколько. */
  choosePrefix: 'Выберите',
  /** Союз между последними вариантами: «А, Б или В», «…; или (Б) …». */
  or: 'или',
  itemSeparator: ', ',
  optionSeparator: '; ',
} as const;

/**
 * Тип маркера разметки по разделу карточки позиции. Раздел, которого здесь
 * нет, и пустой раздел ведут в «Предметы» — так снаряжение хранилось до
 * появления поля.
 */
export const STARTING_EQUIPMENT_MARKER_BY_SECTION: Readonly<
  Record<string, string>
> = {
  'items': 'item',
  'magic-items': 'magicItem',
};

export const STARTING_EQUIPMENT_DEFAULT_MARKER = 'item';

/** Буква первого варианта, когда бэк её не прислал: дальше — по алфавиту. */
export const STARTING_EQUIPMENT_FIRST_LABEL = 'А';
