import type { AbilityKey } from '~/shared/types';

import type {
  ClassFeatureRequirement,
  FeatAbilityBonus,
  FeatChoice,
  FeatChoiceGrant,
  FeatChoiceOption,
  FeatChoiceType,
  FeatCounter,
  FeatEntityRef,
  FeatMechanics,
  FeatModifiers,
  FeatPrerequisiteDetails,
  FeatSenseGrant,
  FeatSpellFilter,
} from './mechanics';

import { isAbilityKey } from '~/shared/types';

import {
  createFeatMechanics,
  createPrerequisiteDetails,
  createSpellFilter,
  getFreeFeatChoiceKey,
} from './mechanics';

/**
 * Строки редактора черты.
 *
 * Механика черты хранится блоками — отдельно безвыборные владения, отдельно
 * выборы, отдельно повышение характеристик, — но автор описывает черту не
 * блоками, а перечислением: «даёт вот это, и вот это, и даёт выбрать вот из
 * чего». Форма правит строки этого перечисления: механику из них собирает
 * {@link fromFeatEditorRows}, а разбирает на них {@link toFeatEditorRows}.
 *
 * Разбор устроен так, чтобы открытая и сохранённая без правок черта отдала ту
 * же механику: всё, чему своей строки нет — чувства неизвестного вида, ссылка
 * повышения на пропавший выбор, — переносится через строки как есть.
 */

/** Что раздаёт строка дара. */
export type FeatGrantRowKind =
  | 'SKILL'
  | 'SAVING_THROW'
  | 'TOOL'
  | 'LANGUAGE'
  | 'ARMOR'
  | 'WEAPON_CATEGORY'
  | 'WEAPON'
  | 'WEAPON_MASTERY'
  | 'ABILITY'
  | 'DAMAGE_TYPE'
  | 'OPTION';

/**
 * Как раздаётся: всё перечисленное сразу или игрок выбирает из набора. Это
 * единственное отличие «владений» от «выборов» — механика у них одна.
 */
export type FeatGrantRowMode = 'ALL' | 'CHOICE';

/** Строка дара: одно, что черта даёт. */
export interface FeatGrantRow {
  /** Ключ строки списка: живёт только в форме и на сервер не уходит. */
  uid: string;

  /**
   * Виды дара строки. Обычно один; несколько — когда игрок выбирает из общей
   * кучи («Умелый»: навык или инструмент). Несколько видов бывает только у
   * выбора: выдать «навык или инструмент» без выбора нечего.
   */
  kinds: Array<FeatGrantRowKind>;

  mode: FeatGrantRowMode;

  /** Что выдаётся либо набор, из которого выбирают; пусто — любое значение. */
  options: Array<FeatChoiceOption>;

  /** Машинный ключ выбора: по нему лист помнит ответ игрока. Автору не виден. */
  key: string;

  label: string;
  count: number | undefined;
  countEqualsProficiencyBonus: boolean;
  grants: FeatChoiceGrant;
  onlyIfNotProficient: boolean;
  onlyIfProficient: boolean;
  expertiseIfProficient: boolean;
  rechooseOnLongRest: boolean;

  /**
   * Прибавка к характеристике. Задана — строка поднимает характеристику: в
   * режиме «выдать всё» перечисленные, в режиме выбора — ту, что назвал игрок
   * («Устойчивый» поднимает характеристику своего спасброска).
   */
  abilityBonus: number | undefined;

  /** Предел повышения: 20 у обычных черт, 30 у эпических даров. */
  abilityUpto: number | undefined;

  /** Выбранному типу урона даётся сопротивление («Отмеченный драконом»). */
  grantsResistance: boolean;

  /**
   * Повышение характеристик привязано к чужому выбору, которого в черте больше
   * нет. Строка такую привязку не показывает, но и не теряет.
   */
  fromChoiceKey: string;

  /**
   * Повышение характеристик приехало ещё и выбором в `choices`, а не одной лишь
   * записью `abilityBonuses`. Выбор возвращается на место при сохранении: к
   * нему привязан ответ игрока на уже взятой черте.
   */
  storedAsChoice: boolean;
}

/** Что меняет строка модификатора на листе. */
export type FeatModifierRowKind =
  | 'HIT_POINTS_FLAT'
  | 'HIT_POINTS_PER_ACQUISITION_LEVEL'
  | 'HIT_POINTS_PER_LEVEL_AFTER'
  | 'SPEED_WALK'
  | 'SPEED_FLY'
  | 'SPEED_CLIMB'
  | 'SPEED_SWIM'
  | 'ARMOR_CLASS'
  | 'INITIATIVE'
  | 'INITIATIVE_PROFICIENCY_BONUS'
  | 'DARKVISION'
  | 'BLINDSIGHT'
  | 'TRUESIGHT'
  | 'TREMORSENSE'
  | 'TELEPATHY'
  | 'DAMAGE_DEFENSE'
  | 'CONDITION_IMMUNITY'
  | 'CREATURE_TYPE';

/** Вид защиты от урона. */
export type FeatDamageDefenseKind = 'RESISTANCE' | 'IMMUNITY' | 'VULNERABILITY';

/** Строка модификатора: одна постоянная правка листа. */
export interface FeatModifierRow {
  uid: string;
  kind: FeatModifierRowKind;
  value: number | undefined;
  /** Скорость равна скорости ходьбы; тогда число не нужно. */
  equalsWalk: boolean;
  damageType: string | undefined;
  defenseKind: FeatDamageDefenseKind;
  condition: string | undefined;
  creatureType: string | undefined;
}

/** Что требует строка предусловия. */
export type FeatPrerequisiteRowKind =
  | 'ABILITY'
  | 'LEVEL'
  | 'SPELLCASTING'
  | 'CLASS_FEATURE'
  | 'ARMOR_PROFICIENCY'
  | 'FEAT'
  | 'CLASS'
  | 'SPECIES'
  | 'BACKGROUND'
  | 'CAMPAIGN'
  | 'ANY_DRAGONMARK'
  | 'TEXT';

/**
 * Строка требования. Внутри строки значения соединяются по «ИЛИ» (одна
 * характеристика читается как «Сила 13+», несколько — как «Сила или Ловкость
 * 13+»), сами строки — по «И».
 */
export interface FeatPrerequisiteRow {
  uid: string;
  kind: FeatPrerequisiteRowKind;
  abilities: Array<AbilityKey>;
  /** Минимум характеристики либо минимальный уровень персонажа. */
  minValue: number | undefined;
  classFeatures: Array<ClassFeatureRequirement>;
  armorCategories: Array<string>;
  /** Требуемые записи справочника: черты, классы, виды, предыстории. */
  refs: Array<FeatEntityRef>;
  /** Сеттинг кампании либо произвольное требование. */
  text: string;
}

/** Строка выбора, связанного с заклинаниями. */
export interface FeatSpellChoiceRow {
  uid: string;
  type: FeatChoiceType;
  key: string;
  label: string;
  count: number | undefined;
  countEqualsProficiencyBonus: boolean;
  /** Набор для выбора: списки классов либо заклинательные характеристики. */
  options: Array<FeatChoiceOption>;
  spellFilter: FeatSpellFilter;
  rechooseOnLongRest: boolean;
}

/** Строка ресурса черты. */
export interface FeatCounterRow extends FeatCounter {
  uid: string;
}

/** Механика черты в том виде, в каком её правит форма. */
export interface FeatEditorRows {
  grants: Array<FeatGrantRow>;
  spellChoices: Array<FeatSpellChoiceRow>;
  modifiers: Array<FeatModifierRow>;
  prerequisites: Array<FeatPrerequisiteRow>;
  counters: Array<FeatCounterRow>;

  /**
   * Чувства, вида которых редактор не знает: своей строки им нет, но выкинуть
   * их нельзя — они возвращаются в механику как есть.
   */
  unknownSenses: Array<FeatSenseGrant>;

  /**
   * Сопротивление привязано к выбору, которого в черте больше нет. Отметку
   * такой привязке поставить не на чем — но и потерять её нельзя: ссылка уйдёт
   * на сервер той же, какой пришла.
   */
  unlinkedResistanceChoiceKey: string;
}

/** Виды дара, дающие владение: от них зависят настройки владения у строки. */
export const PROFICIENCY_GRANT_KINDS: Array<FeatGrantRowKind> = [
  'SKILL',
  'SAVING_THROW',
  'TOOL',
  'LANGUAGE',
  'ARMOR',
  'WEAPON_CATEGORY',
  'WEAPON',
  'WEAPON_MASTERY',
];

/**
 * Виды дара, которые могут дать компетентность. Она удваивает бонус мастерства
 * в проверке, поэтому бывает только у навыков и инструментов: ни у спасброска,
 * ни у языка, ни у оружия удваивать нечего.
 */
export const EXPERTISE_GRANT_KINDS: Array<FeatGrantRowKind> = ['SKILL', 'TOOL'];

/**
 * Виды дара, у которых фиксированной выдачи не бывает: тип урона задаётся
 * защитой на вкладке «Автоматизация», а «вариант» без выбора смысла не имеет.
 */
export const CHOICE_ONLY_GRANT_KINDS: Array<FeatGrantRowKind> = [
  'DAMAGE_TYPE',
  'OPTION',
];

/**
 * Виды дара, которых у выбора не бывает: категория оружия выдаётся целиком, а
 * выбирают уже конкретные виды.
 */
const GRANT_ONLY_KINDS: Array<FeatGrantRowKind> = ['WEAPON_CATEGORY'];

/**
 * Виды дара, которые нельзя смешать с другими в одной строке. Их значения
 * приходят из каталога и самой черты, а не из справочника правил, и в общей
 * куче их не различить.
 */
export const UNMIXABLE_GRANT_KINDS: Array<FeatGrantRowKind> = [
  'WEAPON',
  'WEAPON_MASTERY',
  'WEAPON_CATEGORY',
  'OPTION',
];

/** Тип выбора, которым записывается вид дара. */
const CHOICE_TYPE_BY_GRANT_KIND: Record<FeatGrantRowKind, FeatChoiceType> = {
  SKILL: 'SKILL',
  SAVING_THROW: 'SAVING_THROW',
  TOOL: 'TOOL',
  LANGUAGE: 'LANGUAGE',
  ARMOR: 'ARMOR',
  WEAPON_CATEGORY: 'WEAPON',
  WEAPON: 'WEAPON',
  WEAPON_MASTERY: 'WEAPON_MASTERY',
  ABILITY: 'ABILITY',
  DAMAGE_TYPE: 'DAMAGE_TYPE',
  OPTION: 'OPTION',
};

/** Вид дара, которым читается тип выбора; у заклинаний вида дара нет. */
const GRANT_KIND_BY_CHOICE_TYPE: Partial<
  Record<FeatChoiceType, FeatGrantRowKind>
> = {
  SKILL: 'SKILL',
  SAVING_THROW: 'SAVING_THROW',
  TOOL: 'TOOL',
  LANGUAGE: 'LANGUAGE',
  ARMOR: 'ARMOR',
  WEAPON: 'WEAPON',
  WEAPON_MASTERY: 'WEAPON_MASTERY',
  ABILITY: 'ABILITY',
  DAMAGE_TYPE: 'DAMAGE_TYPE',
  OPTION: 'OPTION',
};

/** Типы выборов, живущих на вкладке «Заклинания». */
export const SPELL_CHOICE_ROW_TYPES: Array<FeatChoiceType> = [
  'SPELL',
  'CANTRIP',
  'SPELL_LIST',
  'SPELLCASTING_ABILITY',
];

/** Приставка машинного ключа для вида дара. */
const CHOICE_KEY_BY_GRANT_KIND: Record<FeatGrantRowKind, string> = {
  SKILL: 'skill',
  SAVING_THROW: 'saving-throw',
  TOOL: 'tool',
  LANGUAGE: 'language',
  ARMOR: 'armor',
  WEAPON_CATEGORY: 'weapon',
  WEAPON: 'weapon',
  WEAPON_MASTERY: 'weapon-mastery',
  ABILITY: 'ability',
  DAMAGE_TYPE: 'damage-type',
  OPTION: 'option',
};

/** Приставка машинного ключа для выбора заклинаний. */
const CHOICE_KEY_BY_SPELL_TYPE: Partial<Record<FeatChoiceType, string>> = {
  SPELL: 'spell',
  CANTRIP: 'cantrip',
  SPELL_LIST: 'spell-list',
  SPELLCASTING_ABILITY: 'spellcasting-ability',
};

/** Приставка машинного ключа ресурса черты. */
const COUNTER_KEY_PREFIX = 'resource';

/** Чувство листа, которым записывается строка модификатора. */
const SENSE_TYPE_BY_MODIFIER_KIND: Partial<
  Record<FeatModifierRowKind, string>
> = {
  DARKVISION: 'DARKVISION',
  BLINDSIGHT: 'BLINDSIGHT',
  TRUESIGHT: 'TRUESIGHT',
  TREMORSENSE: 'TREMORSENSE',
};

/** Модификаторы-скорости, у которых есть отметка «равна скорости ходьбы». */
const EQUALS_WALK_MODIFIER_KINDS: Array<FeatModifierRowKind> = [
  'SPEED_FLY',
  'SPEED_CLIMB',
  'SPEED_SWIM',
];

/** Модификаторы без числового значения: сам факт и есть значение. */
const VALUELESS_MODIFIER_KINDS: Array<FeatModifierRowKind> = [
  'INITIATIVE_PROFICIENCY_BONUS',
  'DAMAGE_DEFENSE',
  'CONDITION_IMMUNITY',
  'CREATURE_TYPE',
];

/** Требования, у которых нет полей: сама строка и есть условие. */
const VALUELESS_PREREQUISITE_KINDS: Array<FeatPrerequisiteRowKind> = [
  'SPELLCASTING',
  'ANY_DRAGONMARK',
];

/** Требования-ссылки: у таких строк правится список записей справочника. */
const REF_PREREQUISITE_KINDS: Array<FeatPrerequisiteRowKind> = [
  'FEAT',
  'CLASS',
  'SPECIES',
  'BACKGROUND',
];

/** Есть ли у вида дара уровень владения. */
export function isProficiencyGrantKind(kind: FeatGrantRowKind): boolean {
  return PROFICIENCY_GRANT_KINDS.includes(kind);
}

/** Может ли вид дара дать компетентность. */
export function isExpertiseGrantKind(kind: FeatGrantRowKind): boolean {
  return EXPERTISE_GRANT_KINDS.includes(kind);
}

/** Можно ли смешать вид дара с другими в одной строке. */
export function isMixableGrantKind(kind: FeatGrantRowKind): boolean {
  return !UNMIXABLE_GRANT_KINDS.includes(kind);
}

/** Основной вид строки: он же единственный, когда вид один. */
export function getPrimaryGrantKind(row: FeatGrantRow): FeatGrantRowKind {
  return row.kinds[0] ?? 'SKILL';
}

/** Есть ли вид среди видов строки. */
export function hasGrantKind(
  row: FeatGrantRow,
  kind: FeatGrantRowKind,
): boolean {
  return row.kinds.includes(kind);
}

/** Даёт ли строка владение — хотя бы одним из своих видов. */
export function isProficiencyGrantRow(row: FeatGrantRow): boolean {
  return row.kinds.some(isProficiencyGrantKind);
}

/** Может ли строка дать компетентность. */
export function isExpertiseGrantRow(row: FeatGrantRow): boolean {
  return row.kinds.some(isExpertiseGrantKind);
}

/**
 * Бывает ли у строки фиксированная выдача. Нескольким видам её не бывает по
 * определению: «навык или инструмент» — это выбор, выдать такое нечем.
 *
 * @param row строка дара.
 * @returns признак строки, которая умеет только выбор.
 */
export function isChoiceOnlyGrantRow(row: FeatGrantRow): boolean {
  return (
    row.kinds.length > 1
    || row.kinds.some((kind) => CHOICE_ONLY_GRANT_KINDS.includes(kind))
  );
}

/**
 * Бывает ли у строки выбор. Категорию оружия выдают целиком: выбирать «простое
 * или воинское» правила не дают, для выбора есть конкретные виды оружия.
 *
 * @param row строка дара.
 * @returns признак строки, которая умеет только фиксированную выдачу.
 */
export function isGrantOnlyRow(row: FeatGrantRow): boolean {
  return row.kinds.some((kind) => GRANT_ONLY_KINDS.includes(kind));
}

/** Нужно ли модификатору числовое поле. */
export function hasModifierValue(kind: FeatModifierRowKind): boolean {
  return !VALUELESS_MODIFIER_KINDS.includes(kind);
}

/** Есть ли у модификатора отметка «равна скорости ходьбы». */
export function supportsEqualsWalk(kind: FeatModifierRowKind): boolean {
  return EQUALS_WALK_MODIFIER_KINDS.includes(kind);
}

/** Требование без полей: такая строка рисуется одной компактной строкой. */
export function isValuelessPrerequisite(
  kind: FeatPrerequisiteRowKind,
): boolean {
  return VALUELESS_PREREQUISITE_KINDS.includes(kind);
}

/** Требование-ссылка на записи справочника. */
export function isRefPrerequisite(kind: FeatPrerequisiteRowKind): boolean {
  return REF_PREREQUISITE_KINDS.includes(kind);
}

let rowSequence = 0;

/**
 * Ключ строки для `v-for`: строки удаляют из середины списка, а по номеру Vue
 * оставил бы соседней строке чужие поля.
 *
 * @param prefix вид строки.
 * @returns ключ, уникальный в пределах сеанса.
 */
function nextRowUid(prefix: string): string {
  rowSequence += 1;

  return `${prefix}-${rowSequence}`;
}

/**
 * Ключи выборов, уже занятые в черте: выборы лежат в механике одним списком, и
 * новый ключ обязан не совпасть ни с одним — иначе два выбора схлопнутся в один
 * и ответ игрока на второй потеряется.
 *
 * @param rows строки редактора.
 * @returns занятые ключи.
 */
export function getTakenChoiceKeys(rows: FeatEditorRows): Array<string> {
  return [
    ...rows.grants.map((row) => row.key.trim()),
    ...rows.spellChoices.map((row) => row.key.trim()),
  ].filter((key) => !!key);
}

/**
 * Новая строка дара.
 *
 * @param kind вид дара.
 * @param takenKeys ключи выборов, занятые в черте.
 * @returns строка дара с уже проставленным машинным ключом.
 */
export function createGrantRow(
  kind: FeatGrantRowKind,
  takenKeys: Array<string>,
): FeatGrantRow {
  const isChoiceOnly = CHOICE_ONLY_GRANT_KINDS.includes(kind);

  return {
    uid: nextRowUid('grant'),
    kinds: [kind],
    mode: isChoiceOnly ? 'CHOICE' : 'ALL',
    options: [],
    key: getFreeFeatChoiceKey(CHOICE_KEY_BY_GRANT_KIND[kind], takenKeys),
    label: '',
    count: 1,
    countEqualsProficiencyBonus: false,
    grants: 'PROFICIENCY',
    onlyIfNotProficient: false,
    onlyIfProficient: false,
    expertiseIfProficient: false,
    rechooseOnLongRest: false,
    abilityBonus: kind === 'ABILITY' ? 1 : undefined,
    abilityUpto: kind === 'ABILITY' ? 20 : undefined,
    grantsResistance: false,
    fromChoiceKey: '',
    storedAsChoice: false,
  };
}

/**
 * Новая строка выбора заклинаний.
 *
 * @param type тип выбора.
 * @param takenKeys ключи выборов, занятые в черте.
 * @returns строка выбора заклинаний.
 */
export function createSpellChoiceRow(
  type: FeatChoiceType,
  takenKeys: Array<string>,
): FeatSpellChoiceRow {
  return {
    uid: nextRowUid('spell-choice'),
    type,
    key: getFreeFeatChoiceKey(
      CHOICE_KEY_BY_SPELL_TYPE[type] ?? 'spell',
      takenKeys,
    ),
    label: '',
    count: 1,
    countEqualsProficiencyBonus: false,
    options: [],
    spellFilter: createSpellFilter(),
    rechooseOnLongRest: false,
  };
}

/**
 * Новая строка модификатора листа.
 *
 * @param kind вид модификатора.
 * @returns строка модификатора.
 */
export function createModifierRow(kind: FeatModifierRowKind): FeatModifierRow {
  return {
    uid: nextRowUid('modifier'),
    kind,
    value: hasModifierValue(kind) ? 0 : undefined,
    equalsWalk: false,
    damageType: undefined,
    defenseKind: 'RESISTANCE',
    condition: undefined,
    creatureType: undefined,
  };
}

/**
 * Новая строка требования.
 *
 * @param kind вид требования.
 * @returns строка требования.
 */
export function createPrerequisiteRow(
  kind: FeatPrerequisiteRowKind,
): FeatPrerequisiteRow {
  return {
    uid: nextRowUid('prerequisite'),
    kind,
    abilities: [],
    minValue: kind === 'LEVEL' ? 4 : 13,
    classFeatures: [],
    armorCategories: [],
    refs: [],
    text: '',
  };
}

/**
 * Новая строка ресурса черты.
 *
 * @param takenKeys ключи ресурсов, занятые в черте.
 * @returns строка ресурса.
 */
export function createCounterRow(takenKeys: Array<string>): FeatCounterRow {
  return {
    uid: nextRowUid('counter'),
    key: getFreeFeatChoiceKey(COUNTER_KEY_PREFIX, takenKeys),
    name: '',
    shortName: '',
    max: '@prof',
    recovery: 'LONG_REST',
  };
}

/** Пустые строки редактора: черта на лист не влияет. */
export function createFeatEditorRows(): FeatEditorRows {
  return {
    grants: [],
    spellChoices: [],
    modifiers: [],
    prerequisites: [],
    counters: [],
    unknownSenses: [],
    unlinkedResistanceChoiceKey: '',
  };
}

/** Значения словаря как набор строки. */
function toDictionaryOptions(values: Array<string>): Array<FeatChoiceOption> {
  return values.map((value) => ({ value }));
}

/** Ссылки справочника как набор строки: снимок названия остаётся при значении. */
function toRefOptions(refs: Array<FeatEntityRef>): Array<FeatChoiceOption> {
  return refs.map((reference) => ({
    value: reference.url,
    name: reference.name,
  }));
}

/** Набор строки как ссылки справочника. */
function toRefs(options: Array<FeatChoiceOption>): Array<FeatEntityRef> {
  return options
    .filter((option) => !!option.value.trim())
    .map((option) => ({ url: option.value.trim(), name: option.name }));
}

/** Набор строки как значения словаря: пустые значения отбрасываются. */
function toValues(options: Array<FeatChoiceOption>): Array<string> {
  return options
    .map((option) => option.value.trim())
    .filter((value) => !!value);
}

/** Строка дара с фиксированной выдачей перечисленных значений. */
function toFixedGrantRow(
  kind: FeatGrantRowKind,
  options: Array<FeatChoiceOption>,
): FeatGrantRow {
  return {
    ...createGrantRow(kind, []),
    // Фиксированной выдаче ключ не нужен: выбора нет, помнить нечего
    key: '',
    mode: 'ALL',
    options,
    abilityBonus: undefined,
    abilityUpto: undefined,
  };
}

/**
 * Виды выбора одним списком: полный набор, если он задан, иначе один основной
 * вид. Пусто — выбор не заполнен и до строки не доедет.
 */
function resolveChoiceTypes(choice: FeatChoice): Array<FeatChoiceType> {
  if (choice.types?.length) {
    return choice.types;
  }

  return choice.type ? [choice.type] : [];
}

/** Строка дара из выбора черты; `undefined` — выбор не про дары. */
function toChoiceGrantRow(choice: FeatChoice): FeatGrantRow | undefined {
  const kinds = resolveChoiceTypes(choice)
    .map((type) => GRANT_KIND_BY_CHOICE_TYPE[type])
    .filter((kind): kind is FeatGrantRowKind => !!kind);

  if (!kinds.length) {
    return undefined;
  }

  return {
    uid: nextRowUid('grant'),
    kinds,
    mode: 'CHOICE',
    options: choice.options.map((option) => ({ ...option })),
    key: choice.key,
    label: choice.label,
    count: choice.count,
    countEqualsProficiencyBonus: choice.countEqualsProficiencyBonus,
    grants: choice.grants ?? 'PROFICIENCY',
    onlyIfNotProficient: choice.onlyIfNotProficient,
    onlyIfProficient: choice.onlyIfProficient,
    expertiseIfProficient: choice.expertiseIfProficient,
    rechooseOnLongRest: choice.rechooseOnLongRest,
    abilityBonus: undefined,
    abilityUpto: undefined,
    grantsResistance: false,
    fromChoiceKey: '',
    storedAsChoice: kinds.includes('ABILITY'),
  };
}

/** Строка выбора заклинаний из выбора черты. */
function toSpellChoiceRow(choice: FeatChoice): FeatSpellChoiceRow {
  return {
    uid: nextRowUid('spell-choice'),
    type: choice.type ?? 'SPELL',
    key: choice.key,
    label: choice.label,
    count: choice.count,
    countEqualsProficiencyBonus: choice.countEqualsProficiencyBonus,
    options: choice.options.map((option) => ({ ...option })),
    spellFilter: choice.spellFilter
      ? { ...choice.spellFilter }
      : createSpellFilter(),
    rechooseOnLongRest: choice.rechooseOnLongRest,
  };
}

/** Строки даров из безвыборных владений. */
function toFixedGrantRows(mechanics: FeatMechanics): Array<FeatGrantRow> {
  const { proficiencies } = mechanics;
  const rows: Array<FeatGrantRow> = [];

  const dictionaryGrants: Array<[FeatGrantRowKind, Array<string>]> = [
    ['SKILL', proficiencies.skills],
    ['SAVING_THROW', proficiencies.savingThrows],
    ['LANGUAGE', proficiencies.languages],
    ['ARMOR', proficiencies.armorCategories],
    ['WEAPON_CATEGORY', proficiencies.weaponCategories],
  ];

  for (const [kind, values] of dictionaryGrants) {
    if (values.length) {
      rows.push(toFixedGrantRow(kind, toDictionaryOptions(values)));
    }
  }

  const refGrants: Array<[FeatGrantRowKind, Array<FeatEntityRef>]> = [
    ['TOOL', proficiencies.tools],
    ['WEAPON', proficiencies.weapons],
    ['WEAPON_MASTERY', proficiencies.weaponMasteries],
  ];

  for (const [kind, refs] of refGrants) {
    if (refs.length) {
      rows.push(toFixedGrantRow(kind, toRefOptions(refs)));
    }
  }

  return rows;
}

/** Строка дара из повышения характеристик, не привязанного к чужому выбору. */
function toAbilityGrantRow(bonus: FeatAbilityBonus): FeatGrantRow {
  // Выбирать не из чего, когда поднимаются все перечисленные: взять столько же,
  // сколько их в наборе, — это и есть фиксированная выдача
  const isFixed =
    bonus.abilities.length > 0 && bonus.count === bonus.abilities.length;

  return {
    ...createGrantRow('ABILITY', []),
    key: '',
    mode: isFixed ? 'ALL' : 'CHOICE',
    options: toDictionaryOptions(bonus.abilities),
    count: isFixed ? undefined : bonus.count,
    abilityBonus: bonus.bonus,
    abilityUpto: bonus.upto,
    fromChoiceKey: bonus.fromChoiceKey,
  };
}

/**
 * Вид модификатора, которым записывается чувство листа.
 *
 * @param type вид чувства из механики.
 * @returns вид строки; `undefined` — чувство редактору незнакомо.
 */
function toSenseModifierKind(
  type: string | undefined,
): FeatModifierRowKind | undefined {
  if (!type) {
    return undefined;
  }

  const found = Object.entries(SENSE_TYPE_BY_MODIFIER_KIND).find(
    ([, senseType]) => senseType === type,
  );

  return found && isModifierRowKind(found[0]) ? found[0] : undefined;
}

/**
 * Известен ли редактору вид модификатора: `Object.entries` отдаёт ключи
 * строками, а приведение типов в проекте запрещено.
 *
 * @param value ключ словаря чувств.
 * @returns признак известного вида модификатора.
 */
function isModifierRowKind(value: string): value is FeatModifierRowKind {
  return value in SENSE_TYPE_BY_MODIFIER_KIND;
}

/** Строки модификаторов из постоянных правок листа. */
function toModifierRows(modifiers: FeatModifiers): {
  rows: Array<FeatModifierRow>;
  unknownSenses: Array<FeatSenseGrant>;
} {
  const rows: Array<FeatModifierRow> = [];
  const unknownSenses: Array<FeatSenseGrant> = [];

  const push = (
    kind: FeatModifierRowKind,
    patch: Partial<FeatModifierRow> = {},
  ): void => {
    rows.push({ ...createModifierRow(kind), ...patch });
  };

  const { hitPoints, speed, damage } = modifiers;

  if (hitPoints.flat !== undefined) {
    push('HIT_POINTS_FLAT', { value: hitPoints.flat });
  }

  if (hitPoints.perAcquisitionLevel !== undefined) {
    push('HIT_POINTS_PER_ACQUISITION_LEVEL', {
      value: hitPoints.perAcquisitionLevel,
    });
  }

  if (hitPoints.perLevelAfterAcquisition !== undefined) {
    push('HIT_POINTS_PER_LEVEL_AFTER', {
      value: hitPoints.perLevelAfterAcquisition,
    });
  }

  if (speed.walkBonus !== undefined) {
    push('SPEED_WALK', { value: speed.walkBonus });
  }

  const speeds: Array<[FeatModifierRowKind, number | undefined, boolean]> = [
    ['SPEED_FLY', speed.fly, speed.flyEqualsWalk],
    ['SPEED_CLIMB', speed.climb, speed.climbEqualsWalk],
    ['SPEED_SWIM', speed.swim, speed.swimEqualsWalk],
  ];

  for (const [kind, value, equalsWalk] of speeds) {
    if (value !== undefined || equalsWalk) {
      push(kind, { value, equalsWalk });
    }
  }

  if (modifiers.armorClassBonus !== undefined) {
    push('ARMOR_CLASS', { value: modifiers.armorClassBonus });
  }

  if (modifiers.initiativeBonus !== undefined) {
    push('INITIATIVE', { value: modifiers.initiativeBonus });
  }

  if (modifiers.initiativeProficiencyBonus) {
    push('INITIATIVE_PROFICIENCY_BONUS');
  }

  for (const sense of modifiers.senses) {
    const kind = toSenseModifierKind(sense.type);

    if (kind) {
      push(kind, { value: sense.range });

      continue;
    }

    unknownSenses.push(sense);
  }

  if (modifiers.telepathyRange !== undefined) {
    push('TELEPATHY', { value: modifiers.telepathyRange });
  }

  const defences: Array<[FeatDamageDefenseKind, Array<string>]> = [
    ['RESISTANCE', damage.resistances],
    ['IMMUNITY', damage.immunities],
    ['VULNERABILITY', damage.vulnerabilities],
  ];

  for (const [defenseKind, damageTypes] of defences) {
    for (const damageType of damageTypes) {
      push('DAMAGE_DEFENSE', { damageType, defenseKind });
    }
  }

  for (const condition of modifiers.conditionImmunities) {
    push('CONDITION_IMMUNITY', { condition });
  }

  if (modifiers.creatureType) {
    push('CREATURE_TYPE', { creatureType: modifiers.creatureType });
  }

  return { rows, unknownSenses };
}

/** Строки требований из разобранного предусловия. */
function toPrerequisiteRows(
  prerequisite: FeatPrerequisiteDetails,
): Array<FeatPrerequisiteRow> {
  const rows: Array<FeatPrerequisiteRow> = [];

  const push = (
    kind: FeatPrerequisiteRowKind,
    patch: Partial<FeatPrerequisiteRow> = {},
  ): void => {
    rows.push({ ...createPrerequisiteRow(kind), ...patch });
  };

  for (const requirement of prerequisite.abilities) {
    push('ABILITY', {
      abilities: [...requirement.anyOf],
      minValue: requirement.minValue,
    });
  }

  if (prerequisite.minCharacterLevel !== undefined) {
    push('LEVEL', { minValue: prerequisite.minCharacterLevel });
  }

  // Умение творить заклинания лежит вместе с остальными классовыми умениями, но
  // своих полей у него нет — поэтому у него отдельная компактная строка
  if (prerequisite.classFeatures.includes('SPELLCASTING')) {
    push('SPELLCASTING');
  }

  const otherFeatures = prerequisite.classFeatures.filter(
    (feature) => feature !== 'SPELLCASTING',
  );

  if (otherFeatures.length) {
    push('CLASS_FEATURE', { classFeatures: otherFeatures });
  }

  if (prerequisite.armorProficiency.length) {
    push('ARMOR_PROFICIENCY', {
      armorCategories: [...prerequisite.armorProficiency],
    });
  }

  const refRequirements: Array<
    [FeatPrerequisiteRowKind, Array<FeatEntityRef>]
  > = [
    ['FEAT', prerequisite.feats],
    ['CLASS', prerequisite.classes],
    ['SPECIES', prerequisite.species],
    ['BACKGROUND', prerequisite.backgrounds],
  ];

  for (const [kind, refs] of refRequirements) {
    if (refs.length) {
      push(kind, { refs: refs.map((reference) => ({ ...reference })) });
    }
  }

  if (prerequisite.campaign) {
    push('CAMPAIGN', { text: prerequisite.campaign });
  }

  if (prerequisite.anyDragonmark) {
    push('ANY_DRAGONMARK');
  }

  if (prerequisite.custom) {
    push('TEXT', { text: prerequisite.custom });
  }

  return rows;
}

/**
 * Разбирает механику и предусловие черты на строки редактора.
 *
 * @param mechanics механика черты.
 * @param prerequisite разобранное предусловие черты.
 * @returns строки редактора.
 */
export function toFeatEditorRows(
  mechanics: FeatMechanics,
  prerequisite: FeatPrerequisiteDetails,
): FeatEditorRows {
  const rows = createFeatEditorRows();

  rows.grants = toFixedGrantRows(mechanics);

  for (const choice of mechanics.choices) {
    if (choice.type && SPELL_CHOICE_ROW_TYPES.includes(choice.type)) {
      rows.spellChoices.push(toSpellChoiceRow(choice));

      continue;
    }

    const row = toChoiceGrantRow(choice);

    if (row) {
      rows.grants.push(row);
    }
  }

  for (const bonus of mechanics.abilityBonuses) {
    const linked = bonus.fromChoiceKey
      ? rows.grants.find((row) => row.key === bonus.fromChoiceKey)
      : undefined;

    // Повышение, привязанное к чужому выбору, живёт в его же строке:
    // «Устойчивый» одной строкой и спрашивает спасбросок, и поднимает
    // характеристику, которую игрок назвал
    if (linked) {
      linked.abilityBonus = bonus.bonus;
      linked.abilityUpto = bonus.upto;

      continue;
    }

    rows.grants.push(toAbilityGrantRow(bonus));
  }

  const resistanceKey = mechanics.modifiers.damage.resistanceFromChoiceKey;

  if (resistanceKey) {
    const linked = rows.grants.find((row) => row.key === resistanceKey);

    if (linked) {
      linked.grantsResistance = true;
    } else {
      rows.unlinkedResistanceChoiceKey = resistanceKey;
    }
  }

  const modifiers = toModifierRows(mechanics.modifiers);

  rows.modifiers = modifiers.rows;
  rows.unknownSenses = modifiers.unknownSenses;
  rows.prerequisites = toPrerequisiteRows(prerequisite);

  rows.counters = mechanics.counters.map((counter) => ({
    ...counter,
    uid: nextRowUid('counter'),
  }));

  return rows;
}

/** Общие поля выбора: подпись, количество, набор, пересмотр на отдыхе. */
function toBaseChoice(
  row: {
    label: string;
    count: number | undefined;
    countEqualsProficiencyBonus: boolean;
    options: Array<FeatChoiceOption>;
    rechooseOnLongRest: boolean;
  },
  key: string,
  type: FeatChoiceType,
): FeatChoice {
  return {
    key,
    type,
    types: undefined,
    label: row.label.trim(),
    count: row.count,
    countEqualsProficiencyBonus: row.countEqualsProficiencyBonus,
    options: row.options
      .filter((option) => !!option.value.trim())
      .map((option) => ({
        value: option.value.trim(),
        ...(option.name ? { name: option.name } : {}),
      })),
    spellFilter: undefined,
    onlyIfNotProficient: false,
    onlyIfProficient: false,
    grants: undefined,
    expertiseIfProficient: false,
    rechooseOnLongRest: row.rechooseOnLongRest,
  };
}

/**
 * Выбор черты из строки дара.
 *
 * Поля, которых у вида дара не бывает, не пишутся: их могли заполнить до смены
 * вида, а форма после неё их уже не показывает — иначе в механике осталась бы
 * бессмыслица вроде компетентности за выбранный язык.
 */
function toGrantChoice(row: FeatGrantRow, key: string): FeatChoice {
  const primary = getPrimaryGrantKind(row);
  const isProficiency = isProficiencyGrantRow(row);
  const isExpertise = isExpertiseGrantRow(row);

  return {
    ...toBaseChoice(row, key, CHOICE_TYPE_BY_GRANT_KIND[primary]),
    // Полный набор пишется, только когда видов правда несколько: одиночный
    // дублировал бы `type` и разошёлся бы с ним при правке
    types:
      row.kinds.length > 1
        ? row.kinds.map((kind) => CHOICE_TYPE_BY_GRANT_KIND[kind])
        : undefined,
    onlyIfNotProficient: isProficiency && row.onlyIfNotProficient,
    onlyIfProficient: isProficiency && row.onlyIfProficient,
    // Исход по умолчанию не пишется: у записей до его появления поля нет, и
    // core-api читает его отсутствие как владение
    grants: isExpertise && row.grants === 'EXPERTISE' ? 'EXPERTISE' : undefined,
    expertiseIfProficient: isExpertise && row.expertiseIfProficient,
  };
}

/** Раскладывает фиксированную выдачу строки по полям владений. */
function applyFixedGrantRow(mechanics: FeatMechanics, row: FeatGrantRow): void {
  const { proficiencies } = mechanics;
  const values = toValues(row.options);

  switch (getPrimaryGrantKind(row)) {
    case 'SKILL':
      proficiencies.skills.push(...values);

      break;
    case 'SAVING_THROW':
      proficiencies.savingThrows.push(...values.filter(isAbilityKey));

      break;
    case 'LANGUAGE':
      proficiencies.languages.push(...values);

      break;
    case 'ARMOR':
      proficiencies.armorCategories.push(...values);

      break;
    case 'WEAPON_CATEGORY':
      proficiencies.weaponCategories.push(...values);

      break;
    case 'WEAPON_MASTERY':
      proficiencies.weaponMasteries.push(...toRefs(row.options));

      break;
    case 'TOOL':
      proficiencies.tools.push(...toRefs(row.options));

      break;
    case 'WEAPON':
      proficiencies.weapons.push(...toRefs(row.options));

      break;
    default:
      break;
  }
}

/**
 * Повышение характеристик из строки дара.
 *
 * @param row строка дара, поднимающая характеристику.
 * @param fromChoiceKey ключ выбора, к которому привязано повышение.
 * @returns вариант повышения; `undefined` — поднимать нечего.
 */
function toAbilityBonus(
  row: FeatGrantRow,
  fromChoiceKey: string,
): FeatAbilityBonus | undefined {
  const abilities = toValues(row.options).filter(isAbilityKey);

  if (!abilities.length && !fromChoiceKey) {
    return undefined;
  }

  return {
    abilities,
    bonus: row.abilityBonus,
    upto: row.abilityUpto,
    // Фиксированная выдача поднимает все перечисленные характеристики: выбрать
    // из них столько же, сколько их есть, — это и значит «все»
    count: row.mode === 'ALL' ? abilities.length : row.count,
    fromChoiceKey,
  };
}

/** Постоянные правки листа из строк модификаторов. */
function toModifiers(
  rows: Array<FeatModifierRow>,
  unknownSenses: Array<FeatSenseGrant>,
): FeatModifiers {
  const modifiers = createFeatMechanics().modifiers;

  for (const row of rows) {
    switch (row.kind) {
      case 'HIT_POINTS_FLAT':
        modifiers.hitPoints.flat = row.value;

        break;
      case 'HIT_POINTS_PER_ACQUISITION_LEVEL':
        modifiers.hitPoints.perAcquisitionLevel = row.value;

        break;
      case 'HIT_POINTS_PER_LEVEL_AFTER':
        modifiers.hitPoints.perLevelAfterAcquisition = row.value;

        break;
      case 'SPEED_WALK':
        modifiers.speed.walkBonus = row.value;

        break;
      case 'SPEED_FLY':
        modifiers.speed.flyEqualsWalk = row.equalsWalk;
        modifiers.speed.fly = row.equalsWalk ? undefined : row.value;

        break;
      case 'SPEED_CLIMB':
        modifiers.speed.climbEqualsWalk = row.equalsWalk;
        modifiers.speed.climb = row.equalsWalk ? undefined : row.value;

        break;
      case 'SPEED_SWIM':
        modifiers.speed.swimEqualsWalk = row.equalsWalk;
        modifiers.speed.swim = row.equalsWalk ? undefined : row.value;

        break;
      case 'ARMOR_CLASS':
        modifiers.armorClassBonus = row.value;

        break;
      case 'INITIATIVE':
        modifiers.initiativeBonus = row.value;

        break;
      case 'INITIATIVE_PROFICIENCY_BONUS':
        modifiers.initiativeProficiencyBonus = true;

        break;
      case 'TELEPATHY':
        modifiers.telepathyRange = row.value;

        break;
      case 'DAMAGE_DEFENSE':
        if (row.damageType && row.defenseKind === 'IMMUNITY') {
          modifiers.damage.immunities.push(row.damageType);
        } else if (row.damageType && row.defenseKind === 'VULNERABILITY') {
          modifiers.damage.vulnerabilities.push(row.damageType);
        } else if (row.damageType) {
          modifiers.damage.resistances.push(row.damageType);
        }

        break;
      case 'CONDITION_IMMUNITY':
        if (row.condition) {
          modifiers.conditionImmunities.push(row.condition);
        }

        break;
      case 'CREATURE_TYPE':
        modifiers.creatureType = row.creatureType;

        break;
      default: {
        const type = SENSE_TYPE_BY_MODIFIER_KIND[row.kind];

        if (type) {
          modifiers.senses.push({ type, range: row.value });
        }

        break;
      }
    }
  }

  modifiers.senses.push(...unknownSenses);

  return modifiers;
}

/** Разобранное предусловие из строк требований. */
function toPrerequisiteDetails(
  rows: Array<FeatPrerequisiteRow>,
): FeatPrerequisiteDetails {
  const prerequisite = createPrerequisiteDetails();

  for (const row of rows) {
    switch (row.kind) {
      case 'ABILITY':
        if (row.abilities.length) {
          prerequisite.abilities.push({
            anyOf: [...row.abilities],
            minValue: row.minValue,
          });
        }

        break;
      case 'LEVEL':
        prerequisite.minCharacterLevel = row.minValue;

        break;
      case 'SPELLCASTING':
        prerequisite.classFeatures.push('SPELLCASTING');

        break;
      case 'CLASS_FEATURE':
        prerequisite.classFeatures.push(...row.classFeatures);

        break;
      case 'ARMOR_PROFICIENCY':
        prerequisite.armorProficiency.push(...row.armorCategories);

        break;
      case 'FEAT':
        prerequisite.feats.push(...row.refs);

        break;
      case 'CLASS':
        prerequisite.classes.push(...row.refs);

        break;
      case 'SPECIES':
        prerequisite.species.push(...row.refs);

        break;
      case 'BACKGROUND':
        prerequisite.backgrounds.push(...row.refs);

        break;
      case 'CAMPAIGN':
        prerequisite.campaign = row.text.trim();

        break;
      case 'ANY_DRAGONMARK':
        prerequisite.anyDragonmark = true;

        break;
      case 'TEXT':
        prerequisite.custom = row.text.trim();

        break;
      default:
        break;
    }
  }

  return prerequisite;
}

/**
 * Собирает механику и предусловие черты из строк редактора.
 *
 * Блоки, у которых своих строк нет — выдаваемые заклинания и расширение списка
 * заклинаний, — берутся из `base` как есть: их форма правит напрямую.
 *
 * @param rows строки редактора.
 * @param base механика формы: источник блоков без строк.
 * @returns механика и разобранное предусловие.
 */
export function fromFeatEditorRows(
  rows: FeatEditorRows,
  base: FeatMechanics,
): { mechanics: FeatMechanics; prerequisiteDetails: FeatPrerequisiteDetails } {
  const mechanics = createFeatMechanics();

  mechanics.spells = base.spells;
  mechanics.spellList = base.spellList;

  const takenKeys = getTakenChoiceKeys(rows);

  /**
   * Ключ строки выбора. Пустой чинится молча: ключ автору не показан, и
   * отбросить из-за него выбор значило бы потерять механику без следа.
   */
  const resolveKey = (key: string, preferred: string): string => {
    const trimmed = key.trim();

    if (trimmed) {
      return trimmed;
    }

    const free = getFreeFeatChoiceKey(preferred, takenKeys);

    takenKeys.push(free);

    return free;
  };

  let resistanceFromChoiceKey = rows.unlinkedResistanceChoiceKey.trim();

  for (const row of rows.grants) {
    const primary = getPrimaryGrantKind(row);

    // Повышение характеристик само по себе и есть выбор: набор, количество и
    // прибавка описаны одной записью, отдельный выбор ей не нужен
    if (primary === 'ABILITY' && !row.storedAsChoice) {
      const bonus = toAbilityBonus(row, row.fromChoiceKey.trim());

      if (bonus) {
        mechanics.abilityBonuses.push(bonus);
      }

      continue;
    }

    if (row.mode === 'ALL') {
      applyFixedGrantRow(mechanics, row);

      continue;
    }

    const key = resolveKey(row.key, CHOICE_KEY_BY_GRANT_KIND[primary]);

    mechanics.choices.push(toGrantChoice(row, key));

    if (row.abilityBonus !== undefined) {
      const bonus = toAbilityBonus(row, key);

      if (bonus) {
        mechanics.abilityBonuses.push(bonus);
      }
    }

    // Своя отметка перебивает потерянную ссылку: строка с ней в черте есть
    if (hasGrantKind(row, 'DAMAGE_TYPE') && row.grantsResistance) {
      resistanceFromChoiceKey = key;
    }
  }

  for (const row of rows.spellChoices) {
    const key = resolveKey(
      row.key,
      CHOICE_KEY_BY_SPELL_TYPE[row.type] ?? 'spell',
    );

    const choice = toBaseChoice(row, key, row.type);

    if (row.type === 'SPELL' || row.type === 'CANTRIP') {
      choice.spellFilter = { ...row.spellFilter };
    }

    mechanics.choices.push(choice);
  }

  mechanics.modifiers = toModifiers(rows.modifiers, rows.unknownSenses);
  mechanics.modifiers.damage.resistanceFromChoiceKey = resistanceFromChoiceKey;

  mechanics.counters = rows.counters.map((row) => ({
    key: row.key.trim(),
    name: row.name.trim(),
    shortName: row.shortName.trim(),
    max: row.max.trim(),
    recovery: row.recovery,
  }));

  return {
    mechanics,
    prerequisiteDetails: toPrerequisiteDetails(rows.prerequisites),
  };
}
