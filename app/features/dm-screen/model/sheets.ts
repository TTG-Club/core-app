import type { Character, SheetKeyTarget } from '~character-sheet/model';

import type { ScreenSheetOption } from './types';

import {
  CHARACTER_SHEET_ROUTE,
  getClassesDisplayLabel,
  getDisplayLevel,
  getSheetPagePath,
  getSpeciesDisplayName,
} from '~character-sheet/model';

import { DM_SCREEN_TEXT } from './constants';

/** Адрес листа персонажа: свой — по идентификатору, чужой — по токену ссылки. */
const SHEET_PATH_PATTERN = new RegExp(
  `^${CHARACTER_SHEET_ROUTE}/(shared/)?([^/?#]+)/?$`,
);

/**
 * Лист персонажа по пути окна: чей он и чем открывается. Путь окна с листом
 * — адрес страницы листа на сайте (`getSheetPagePath`). Остальные пути — не
 * листы.
 * @param path - путь окна
 */
export function resolveScreenSheet(path: string): SheetKeyTarget | undefined {
  const [, sharedPrefix, id] = SHEET_PATH_PATTERN.exec(path) ?? [];

  if (!id) {
    return undefined;
  }

  return { source: sharedPrefix ? 'shared' : 'own', id };
}

/**
 * Строка под именем персонажа: классы с уровнями и вид; у листа без класса
 * — общий уровень.
 * @param character - персонаж листа
 */
function getSheetSubtitle(character: Character): string {
  const classes =
    getClassesDisplayLabel(character)
    || `${DM_SCREEN_TEXT.sheetLevel} ${getDisplayLevel(character)}`;

  return character.species
    ? `${classes} · ${getSpeciesDisplayName(character.species)}`
    : classes;
}

/**
 * Лист персонажа как вариант выбора в списке «Персонаж».
 * @param character - персонаж листа
 * @param target - чей лист и чем он открывается
 */
export function buildScreenSheetOption(
  character: Character,
  target: SheetKeyTarget,
): ScreenSheetOption {
  return {
    path: getSheetPagePath(target),
    source: target.source,
    name: character.name,
    subtitle: getSheetSubtitle(character),
    avatarUrl: character.avatarUrl ?? undefined,
  };
}
