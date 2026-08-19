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
 * Блоки, общие с механикой вида (выборы, модификаторы листа, владения, чувства,
 * фильтр заклинаний), живут в `~/shared/types` — как и в core-api, где они
 * переехали в `common/model/mechanics`. Здесь остаётся то, что бывает только у
 * черты: повышение характеристик, предусловие и выдача заклинаний.
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

/**
 * Заклинания, которые черта даёт знать без выбора: «Отмеченный драконом Ориена»
 * даёт «Магическую руку». Выбираемые заклинания сюда не идут — у них есть
 * количество и фильтр пула, поэтому они живут в {@link MechanicChoice}.
 *
 * Своим блоком, а не общим с видом: заклинания вида лежат в связующей таблице
 * (`innateSpells`) со своими требуемыми уровнями.
 */
export interface FeatSpellGrant {
  /**
   * Заклинания справочника ссылками — без снимка круга и школы: те берутся из
   * самой записи заклинания и в снимке разошлись бы с каталогом при его правке.
   * Потребителю их отдаёт core-api отдельным полем детали (`grantedSpells`).
   */
  spells: Array<MechanicEntityRef>;

  /**
   * Характеристика для расчёта СЛ и атаки заклинаний черты. `undefined` — черта
   * её не задаёт: тогда лист берёт характеристику того класса, чья это магия.
   */
  spellcastingAbility: AbilityKey | undefined;

  /** Заклинание всегда подготовлено и не занимает ячейку подготовки. */
  alwaysPrepared: boolean;
}

/** Механика черты целиком. */
export interface FeatMechanics {
  abilityBonuses: Array<FeatAbilityBonus>;
  choices: Array<MechanicChoice>;
  modifiers: SheetModifiers;
  proficiencies: ProficiencyGrant;
  spells: FeatSpellGrant;
}

/**
 * Свободный ключ выбора: к занятому имени приписывается номер. Ключ попадает в
 * идентификатор умения на листе персонажа, поэтому два выбора с одним ключом
 * схлопнулись бы в один.
 *
 * @param preferred желаемый ключ.
 * @param taken ключи, уже занятые в этой черте.
 * @returns желаемый ключ либо он же с номером.
 */
export function getFreeFeatChoiceKey(
  preferred: string,
  taken: Array<string>,
): string {
  if (!taken.includes(preferred)) {
    return preferred;
  }

  let position = 2;

  while (taken.includes(`${preferred}-${position}`)) {
    position += 1;
  }

  return `${preferred}-${position}`;
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

/** Пустая выдача заклинаний. */
export function createFeatSpellGrant(): FeatSpellGrant {
  return {
    spells: [],
    spellcastingAbility: undefined,
    alwaysPrepared: false,
  };
}

/** Пустая механика черты. */
export function createFeatMechanics(): FeatMechanics {
  return {
    abilityBonuses: [],
    choices: [],
    modifiers: createSheetModifiers(),
    proficiencies: createProficiencyGrant(),
    spells: createFeatSpellGrant(),
  };
}
