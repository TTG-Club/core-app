/**
 * Чей лист открыт: свой — по идентификатору, чужой — по токену ссылки,
 * которой поделился владелец.
 */
export type SheetKeySource = 'own' | 'shared';

/** Что открыто под ключом листа. */
export interface SheetKeyTarget {
  source: SheetKeySource;

  /** Идентификатор своего листа либо токен ссылки чужого. */
  id: string;
}

/** Части состояния открытого листа: у каждой своя ячейка на каждый лист. */
export type SheetStateName =
  | 'character'
  | 'locked'
  | 'readonly-reason'
  | 'load-status';

/** Все части состояния открытого листа — чтобы очистить их разом. */
export const SHEET_STATE_NAMES: ReadonlyArray<SheetStateName> = [
  'character',
  'locked',
  'readonly-reason',
  'load-status',
];

/** Разделитель источника и идентификатора в ключе листа. */
const SHEET_KEY_SEPARATOR = ':';

/** Ошибка компонента листа, которому не передали ключ листа. */
const SHEET_KEY_MISSING_ERROR =
  'Компоненту листа персонажа не передан ключ листа (sheetKey)';

/** Начало имён ячеек состояния листа в `useState`. */
const SHEET_STATE_PREFIX = 'character-sheet';

/**
 * Ключ открытого листа. Под ним лежит всё состояние листа, поэтому в одной
 * вкладке могут быть открыты несколько листов, а один и тот же лист,
 * открытый в двух местах, остаётся одним листом.
 * @param target - чей лист и чем он открывается
 */
export function createSheetKey(target: SheetKeyTarget): string {
  return `${target.source}${SHEET_KEY_SEPARATOR}${target.id}`;
}

/**
 * Что открыто под ключом листа. Ключ без известного источника считается
 * своим листом с таким идентификатором.
 * @param sheetKey - ключ открытого листа
 */
export function parseSheetKey(sheetKey: string): SheetKeyTarget {
  const separatorIndex = sheetKey.indexOf(SHEET_KEY_SEPARATOR);
  const source = sheetKey.slice(0, separatorIndex);
  const id = sheetKey.slice(separatorIndex + 1);

  if (separatorIndex >= 0 && source === 'shared') {
    return { source: 'shared', id };
  }

  if (separatorIndex >= 0 && source === 'own') {
    return { source: 'own', id };
  }

  return { source: 'own', id: sheetKey };
}

/**
 * Имя ячейки `useState` для части состояния листа.
 * @param name - часть состояния
 * @param sheetKey - ключ открытого листа
 * @throws если ключ пуст
 */
export function getSheetStateKey(
  name: SheetStateName,
  sheetKey: string,
): string {
  // Пустой ключ молча свёл бы разные листы в одну ячейку: правки одного
  // персонажа легли бы в документ другого. Лучше упасть сразу
  if (!sheetKey) {
    throw new Error(SHEET_KEY_MISSING_ERROR);
  }

  return [SHEET_STATE_PREFIX, name, sheetKey].join(SHEET_KEY_SEPARATOR);
}
