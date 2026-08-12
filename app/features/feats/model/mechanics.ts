import type { AbilityKey } from '~/shared/types';

/**
 * Механика черты: то, что лист персонажа считает сам, а не показывает текстом.
 *
 * Зеркало `FeatMechanics` из core-api. Структура повторяет ответ
 * `GET /api/v2/feats/{url}/raw`, поэтому форма отправляет её без преобразований.
 */

/** Классовое умение, которого требует черта. */
export type ClassFeatureRequirement =
  | 'SPELLCASTING'
  | 'PACT_MAGIC'
  | 'FIGHTING_STYLE'
  | 'WEAPON_MASTERY';

/** Что именно выбирает игрок при взятии черты. */
export type FeatChoiceType =
  | 'ABILITY'
  | 'SAVING_THROW'
  | 'SKILL'
  | 'TOOL'
  | 'LANGUAGE'
  | 'DAMAGE_TYPE'
  | 'SPELL'
  | 'CANTRIP'
  | 'SPELL_LIST'
  | 'SPELLCASTING_ABILITY'
  | 'WEAPON'
  | 'OPTION';

/** Ссылка на сущность справочника: url и снимок названия. */
export interface FeatEntityRef {
  url: string;
  name?: string;
}

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
  feats: Array<FeatEntityRef>;
  anyDragonmark: boolean;
  classFeatures: Array<ClassFeatureRequirement>;
  classes: Array<FeatEntityRef>;
  species: Array<FeatEntityRef>;
  backgrounds: Array<FeatEntityRef>;
  armorProficiency: Array<string>;
  campaign: string;
  /** Условие, которое лист не проверяет: «превращение в лича» и подобное. */
  custom: string;
}

/** Допустимое значение выбора: код словаря либо url сущности. */
export interface FeatChoiceOption {
  value: string;
  name?: string;
}

/** Чем ограничен выбор заклинания или заговора. */
export interface FeatSpellFilter {
  level: number | undefined;
  maxLevel: number | undefined;
  schools: Array<string>;
  classes: Array<FeatEntityRef>;
  castingTime: string | undefined;
}

/**
 * Выбор, который игрок делает в момент взятия черты.
 *
 * Выборы по ходу игры («выберите существо в пределах 30 футов») сюда не идут:
 * лист их не запоминает, они остаются в описании.
 */
export interface FeatChoice {
  key: string;
  type: FeatChoiceType | undefined;
  label: string;
  count: number | undefined;
  countEqualsProficiencyBonus: boolean;
  options: Array<FeatChoiceOption>;
  spellFilter: FeatSpellFilter | undefined;
  onlyIfNotProficient: boolean;
  expertiseIfProficient: boolean;
  rechooseOnLongRest: boolean;
}

/**
 * Прибавка к максимуму хитов.
 *
 * Итог: `flat + perAcquisitionLevel × уровень взятия +
 * perLevelAfterAcquisition × (текущий уровень − уровень взятия)`. Из-за двух
 * последних лист обязан хранить уровень, на котором черта взята.
 */
export interface FeatHitPointsModifier {
  flat: number | undefined;
  perAcquisitionLevel: number | undefined;
  perLevelAfterAcquisition: number | undefined;
}

/** Постоянное изменение скоростей в футах. */
export interface FeatSpeedModifier {
  walkBonus: number | undefined;
  fly: number | undefined;
  climb: number | undefined;
  swim: number | undefined;
  flyEqualsWalk: boolean;
  climbEqualsWalk: boolean;
  swimEqualsWalk: boolean;
}

/** Чувство с дистанцией в футах. */
export interface FeatSenseGrant {
  type: string | undefined;
  range: number | undefined;
}

/** Сопротивления, иммунитеты и уязвимости к урону. */
export interface FeatDamageAffinity {
  resistances: Array<string>;
  immunities: Array<string>;
  vulnerabilities: Array<string>;
  /** Ключ выбора типа урона, к которому даётся сопротивление. */
  resistanceFromChoiceKey: string;
}

/**
 * Постоянные модификаторы листа.
 *
 * Условные эффекты сюда не попадают: «Оборона» даёт +1 к КД только в доспехе,
 * «Дар духа ночи» — сопротивление только в темноте. Они остаются в описании.
 */
export interface FeatModifiers {
  hitPoints: FeatHitPointsModifier;
  speed: FeatSpeedModifier;
  armorClassBonus: number | undefined;
  senses: Array<FeatSenseGrant>;
  telepathyRange: number | undefined;
  damage: FeatDamageAffinity;
  conditionImmunities: Array<string>;
  creatureType: string | undefined;
  initiativeProficiencyBonus: boolean;
}

/** Механика черты целиком. */
export interface FeatMechanics {
  abilityBonuses: Array<FeatAbilityBonus>;
  choices: Array<FeatChoice>;
  modifiers: FeatModifiers;
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

/** Новый выбор при взятии черты. */
export function createFeatChoice(): FeatChoice {
  return {
    key: '',
    type: undefined,
    label: '',
    count: 1,
    countEqualsProficiencyBonus: false,
    options: [],
    spellFilter: undefined,
    onlyIfNotProficient: false,
    expertiseIfProficient: false,
    rechooseOnLongRest: false,
  };
}

/** Новое чувство. */
export function createSenseGrant(): FeatSenseGrant {
  return {
    type: undefined,
    range: 10,
  };
}

/** Пустой фильтр заклинаний. */
export function createSpellFilter(): FeatSpellFilter {
  return {
    level: undefined,
    maxLevel: undefined,
    schools: [],
    classes: [],
    castingTime: undefined,
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

/** Пустые постоянные модификаторы листа. */
export function createFeatModifiers(): FeatModifiers {
  return {
    hitPoints: {
      flat: undefined,
      perAcquisitionLevel: undefined,
      perLevelAfterAcquisition: undefined,
    },
    speed: {
      walkBonus: undefined,
      fly: undefined,
      climb: undefined,
      swim: undefined,
      flyEqualsWalk: false,
      climbEqualsWalk: false,
      swimEqualsWalk: false,
    },
    armorClassBonus: undefined,
    senses: [],
    telepathyRange: undefined,
    damage: {
      resistances: [],
      immunities: [],
      vulnerabilities: [],
      resistanceFromChoiceKey: '',
    },
    conditionImmunities: [],
    creatureType: undefined,
    initiativeProficiencyBonus: false,
  };
}

/** Пустая механика черты. */
export function createFeatMechanics(): FeatMechanics {
  return {
    abilityBonuses: [],
    choices: [],
    modifiers: createFeatModifiers(),
  };
}
