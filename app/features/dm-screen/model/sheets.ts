import type { Character } from '~character-sheet/model';

import type {
  ScreenSheetCard,
  ScreenSheetLocation,
  ScreenSheetOption,
} from './types';

import {
  CHARACTER_SHEET_ROUTE,
  CHARACTER_SHEET_SHARED_ROUTE,
  getAbilityRows,
  getArmorClassValue,
  getCharacterProficiencyBonus,
  getClassesDisplayLabel,
  getDisplayLevel,
  getEffectiveSpeed,
  getInitiativeBonus,
  getMaxHitPoints,
  getPrimarySpeed,
  getSavingThrowRows,
  getSkillRows,
  getSpeciesDisplayName,
  SKILL_NAME_BY_API_KEY,
} from '~character-sheet/model';

import { DM_SCREEN_ICONS, DM_SCREEN_TEXT } from './constants';

/** Адрес листа персонажа: свой — по идентификатору, чужой — по токену ссылки. */
const SHEET_PATH_PATTERN = new RegExp(
  `^${CHARACTER_SHEET_ROUTE}/(shared/)?([^/?#]+)/?$`,
);

/**
 * Лист персонажа по пути окна: чей он и чем открывается. Остальные пути —
 * не листы.
 * @param path - путь окна
 */
export function resolveScreenSheet(
  path: string,
): ScreenSheetLocation | undefined {
  const [, sharedPrefix, key] = SHEET_PATH_PATTERN.exec(path) ?? [];

  if (!key) {
    return undefined;
  }

  return { source: sharedPrefix ? 'shared' : 'own', key };
}

/**
 * Путь окна с листом персонажа: он же адрес страницы листа на сайте.
 * @param location - чей лист и чем он открывается
 */
export function createScreenSheetPath(location: ScreenSheetLocation): string {
  return location.source === 'shared'
    ? `${CHARACTER_SHEET_SHARED_ROUTE}/${location.key}`
    : `${CHARACTER_SHEET_ROUTE}/${location.key}`;
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
 * @param location - чей лист и чем он открывается
 */
export function buildScreenSheetOption(
  character: Character,
  location: ScreenSheetLocation,
): ScreenSheetOption {
  return {
    path: createScreenSheetPath(location),
    source: location.source,
    name: character.name,
    subtitle: getSheetSubtitle(character),
    avatarUrl: character.avatarUrl ?? undefined,
  };
}

/**
 * Карточка листа для окна ширмы: то, что мастеру нужно видеть за столом.
 * Все числа считает сам лист — с предметами, эффектами и истощением, —
 * поэтому карточка совпадает с тем, что видит игрок.
 * @param character - персонаж листа
 */
export function toScreenSheetCard(character: Character): ScreenSheetCard {
  const { health } = character;
  const speed = getPrimarySpeed(getEffectiveSpeed(character));
  const skills = getSkillRows(character);
  const savingThrows = getSavingThrowRows(character);

  const perception = skills.find(
    (skill) => skill.name === SKILL_NAME_BY_API_KEY.PERCEPTION,
  );

  return {
    name: character.name,
    subtitle: getSheetSubtitle(character),
    avatarUrl: character.avatarUrl ?? undefined,
    hitPoints: `${health.current} / ${getMaxHitPoints(character)}`,
    temporaryHitPoints:
      health.temporary > 0
        ? `+${health.temporary} ${DM_SCREEN_TEXT.sheetTemporary}`
        : undefined,
    exhaustion:
      health.exhaustion > 0
        ? `${DM_SCREEN_TEXT.sheetExhaustion}: ${health.exhaustion}`
        : undefined,
    stats: [
      {
        key: 'armor-class',
        label: DM_SCREEN_TEXT.sheetArmorClass,
        icon: DM_SCREEN_ICONS.sheetArmorClass,
        value: String(getArmorClassValue(character)),
      },
      {
        key: 'initiative',
        label: DM_SCREEN_TEXT.sheetInitiative,
        icon: DM_SCREEN_ICONS.sheetInitiative,
        value: getFormattedBonus(getInitiativeBonus(character)),
      },
      {
        key: 'speed',
        label: DM_SCREEN_TEXT.sheetSpeed,
        icon: DM_SCREEN_ICONS.sheetSpeed,
        value: `${speed.value} ${speed.unitLabel}`,
      },
      {
        key: 'proficiency',
        label: DM_SCREEN_TEXT.sheetProficiency,
        icon: DM_SCREEN_ICONS.sheetProficiency,
        value: getFormattedBonus(getCharacterProficiencyBonus(character)),
      },
      ...(perception
        ? [
            {
              key: 'passive-perception',
              label: DM_SCREEN_TEXT.sheetPassivePerception,
              icon: DM_SCREEN_ICONS.sheetPassivePerception,
              value: String(perception.passiveValue),
            },
          ]
        : []),
    ],
    abilities: getAbilityRows(character).map((ability) => {
      const savingThrow = savingThrows.find(
        (candidate) => candidate.key === ability.key,
      );

      return {
        key: ability.key,
        label: ability.shortLabel,
        score: ability.score,
        modifier: ability.formattedModifier,
        savingThrow: savingThrow?.formattedValue ?? ability.formattedModifier,
        isSavingThrowProficient: savingThrow?.proficient ?? false,
      };
    }),
    skills: skills.map((skill) => ({
      name: skill.name,
      modifier: skill.formattedModifier,
      isProficient: skill.proficiency !== 'none',
    })),
  };
}
