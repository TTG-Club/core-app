import type {
  AbilityKey,
  MechanicChoice,
  MechanicEntityRef,
  ProficiencyGrant,
  SheetModifiers,
} from '~/shared/types';

import { createProficiencyGrant, createSheetModifiers } from '~/shared/types';

/**
 * Механика черты: то, что лист персонажа считает сам, а не показывает текстом.
 *
 * Зеркало `FeatMechanics` из core-api. Структура повторяет ответ
 * `GET /api/v2/feats/{url}/raw`, поэтому форма отправляет её без преобразований.
 *
 * Блоки, общие с умением вида (выборы, модификаторы листа, владения, чувства),
 * живут в `~/shared/types` — как и в core-api, где они переехали в
 * `common/model/mechanics`. Здесь остаётся то, что бывает только у черты:
 * повышение характеристик и предварительное условие.
 */

/** Классовое умение, которого требует черта. */
export type ClassFeatureRequirement =
  | 'SPELLCASTING'
  | 'PACT_MAGIC'
  | 'FIGHTING_STYLE'
  | 'WEAPON_MASTERY';

/**
 * Вариант повышения характеристик: из `abilities` игрок выбирает `count`
 * характеристик и поднимает каждую на `bonus`, но не выше `upto`.
 *
 * Несколько вариантов в списке — это выбор «или»: «Улучшение характеристик»
 * даёт `+2 к одной` либо `+1 к двум`.
 */
export interface FeatAbilityBonus {
  abilities: Array<AbilityKey>;
  bonus: number | undefined;
  upto: number | undefined;
  count: number | undefined;
  /** Ключ ранее сделанного выбора, если повышение привязано к нему. */
  fromChoiceKey: string;
}

/** Требование к значению характеристики: достаточно любой из `anyOf`. */
export interface FeatAbilityRequirement {
  anyOf: Array<AbilityKey>;
  minValue: number | undefined;
}

/** Предварительное условие в разобранном виде. */
export interface FeatPrerequisiteDetails {
  minCharacterLevel: number | undefined;
  abilities: Array<FeatAbilityRequirement>;
  feats: Array<MechanicEntityRef>;
  anyDragonmark: boolean;
  classFeatures: Array<ClassFeatureRequirement>;
  classes: Array<MechanicEntityRef>;
  species: Array<MechanicEntityRef>;
  backgrounds: Array<MechanicEntityRef>;
  armorProficiency: Array<string>;
  campaign: string;
  /** Условие, которое лист не проверяет: «превращение в лича» и подобное. */
  custom: string;
}

/** Механика черты целиком. */
export interface FeatMechanics {
  abilityBonuses: Array<FeatAbilityBonus>;
  choices: Array<MechanicChoice>;
  modifiers: SheetModifiers;
  proficiencies: ProficiencyGrant;
}

/** Новый вариант повышения характеристик. */
export function createAbilityBonus(): FeatAbilityBonus {
  return {
    abilities: [],
    bonus: 1,
    upto: 20,
    count: 1,
    fromChoiceKey: '',
  };
}

/** Новое требование к характеристикам. */
export function createAbilityRequirement(): FeatAbilityRequirement {
  return {
    anyOf: [],
    minValue: 13,
  };
}

/** Пустое разобранное предусловие. */
export function createPrerequisiteDetails(): FeatPrerequisiteDetails {
  return {
    minCharacterLevel: undefined,
    abilities: [],
    feats: [],
    anyDragonmark: false,
    classFeatures: [],
    classes: [],
    species: [],
    backgrounds: [],
    armorProficiency: [],
    campaign: '',
    custom: '',
  };
}

/** Пустая механика черты. */
export function createFeatMechanics(): FeatMechanics {
  return {
    abilityBonuses: [],
    choices: [],
    modifiers: createSheetModifiers(),
    proficiencies: createProficiencyGrant(),
  };
}
