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

/**
 * Что даёт сделанный выбор. `EXPERTISE` — безусловная компетентность («Знаток»);
 * условная замена «владеешь — получишь компетентность» описана отдельным флагом
 * `expertiseIfProficient` («Наблюдательный»).
 */
export type FeatChoiceGrant = 'PROFICIENCY' | 'EXPERTISE';

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

  /** Классы, из списков заклинаний которых можно выбирать. */
  classes: Array<FeatEntityRef>;

  /**
   * Ключ выбора, из ответа на который берётся класс. «Посвящённый в магию»
   * сначала спрашивает список — жреца, друида или волшебника, — и только потом
   * даёт выбрать из него заговоры: пул сужается до выбранного класса, а не до
   * всех трёх. Пусто — пул задан `classes` напрямую.
   */
  classesFromChoiceKey: string;

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

  /**
   * Выбирать можно только то, чем персонаж уже владеет («Знаток» — навык, в
   * котором есть владение). Обратен `onlyIfNotProficient`: вместе они оставляют
   * пустой пул, поэтому форма даёт отметить только один из двух.
   */
  onlyIfProficient: boolean;

  /**
   * Что даёт выбор: владение или компетентность. Компетентность удваивает бонус
   * мастерства, поэтому это не «владение посильнее», а другой исход.
   *
   * `undefined` — владение: так поле уходит из отправляемой механики, когда
   * исход обычный, и так же читаются записи, сделанные до его появления.
   */
  grants: FeatChoiceGrant | undefined;

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

  /**
   * Прибавка к инициативе: числом — «Бдительный» издания 2014 даёт +5, — и
   * бонусом мастерства, как «Бдительный» издания 2024. Слагаемые независимы:
   * лист складывает оба, а не выбирает одно.
   */
  initiativeBonus: number | undefined;
  initiativeProficiencyBonus: boolean;
}

/**
 * Владения, которые черта выдаёт сразу и целиком: «Вы получаете владение
 * воинским оружием». Выбираемые владения сюда не идут — у них есть количество и
 * пул значений, поэтому они живут в {@link FeatChoice}.
 *
 * Спасбросков здесь нет: их черты выдают выбором.
 */
export interface FeatProficiencyGrant {
  /** Категории оружия справочника (`MATERIAL_MELEE` и подобные). */
  weaponCategories: Array<string>;

  /** Категории доспехов справочника (`MEDIUM`, `SHIELD`). */
  armorCategories: Array<string>;

  /** Навыки справочника (`PERCEPTION`, `STEALTH`). */
  skills: Array<string>;

  /**
   * Языки справочника (`COMMON`, `DWARVISH`) — константами и ровно в том
   * написании, в каком их отдаёт справочник: среди них есть `Celestial`, и
   * приведение регистра сломало бы сверку. Со словарём языков листа справочник
   * сводит выгрузка компендиума.
   */
  languages: Array<string>;

  /** Инструменты из раздела «Предметы». */
  tools: Array<FeatEntityRef>;
}

/**
 * Заклинания, которые черта даёт знать без выбора: «Отмеченный драконом Ориена»
 * даёт «Магическую руку». Выбираемые заклинания сюда не идут — у них есть
 * количество и фильтр пула, поэтому они живут в {@link FeatChoice}.
 */
export interface FeatSpellGrant {
  /**
   * Заклинания справочника ссылками — без снимка круга и школы: те берутся из
   * самой записи заклинания и в снимке разошлись бы с каталогом при его правке.
   * Потребителю их отдаёт core-api отдельным полем детали (`grantedSpells`).
   */
  spells: Array<FeatEntityRef>;

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
  choices: Array<FeatChoice>;
  modifiers: FeatModifiers;
  proficiencies: FeatProficiencyGrant;
  spells: FeatSpellGrant;
}

/**
 * Ссылки на сущности к списку url: селекты справочников хранят только их.
 *
 * @param refs ссылки на сущности.
 * @returns url сущностей.
 */
export function toEntityRefUrls(refs: Array<FeatEntityRef>): Array<string> {
  return refs.map((reference) => reference.url);
}

/**
 * Url к ссылкам: core-api хранит ссылку как есть и название сам не подставляет,
 * но предусловию снимок имени и не нужен — выбранное показывают пикеры по url.
 * Там, где имя читает лист персонажа (инструменты в выдаваемых владениях),
 * ссылка собирается вместе с названием — см. `FeatProficiencies`.
 *
 * @param urls url сущностей.
 * @returns ссылки на сущности.
 */
export function toEntityRefs(urls: Array<string>): Array<FeatEntityRef> {
  return urls.map((url) => ({ url }));
}

/**
 * Значение селекта к списку: одиночный выбор приходит строкой, пустой — ничем.
 *
 * @param value значение селекта.
 * @returns выбранные значения списком.
 */
export function toUrlList(
  value: string | Array<string> | undefined,
): Array<string> {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
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
    onlyIfProficient: false,
    grants: 'PROFICIENCY',
    expertiseIfProficient: false,
    rechooseOnLongRest: false,
  };
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
    classesFromChoiceKey: '',
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
    initiativeBonus: undefined,
    initiativeProficiencyBonus: false,
  };
}

/** Пустая выдача владений. */
export function createFeatProficiencyGrant(): FeatProficiencyGrant {
  return {
    weaponCategories: [],
    armorCategories: [],
    skills: [],
    languages: [],
    tools: [],
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
    modifiers: createFeatModifiers(),
    proficiencies: createFeatProficiencyGrant(),
    spells: createFeatSpellGrant(),
  };
}
