import type { AbilityKey } from '~/shared/types';

import type {
  ClassFeatureRequirement,
  FeatAbilityBonus,
  FeatChoice,
  FeatChoiceGrant,
  FeatChoiceOption,
  FeatChoiceScaling,
  FeatChoiceType,
  FeatCounter,
  FeatDamageAffinity,
  FeatDamageDefenseChoice,
  FeatDamageDefenseKind,
  FeatEntityRef,
  FeatMechanics,
  FeatModifiers,
  FeatPrerequisiteDetails,
  FeatSenseGrant,
  FeatSpellGrant,
} from './mechanics';

import { ABILITY_LABELS, isAbilityKey } from '~/shared/types';

import {
  createFeatMechanics,
  createPrerequisiteDetails,
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
  | 'MASTERY_PROPERTY'
  | 'ABILITY'
  | 'DAMAGE_TYPE'
  | 'OPTION'
  | 'FEAT';

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

  /**
   * Категории черт, из которых выбирают; только у вида «Черта» в режиме выбора.
   * Пусто — категория не ограничена. Складывается с набором: перечисленные
   * черты сужают пул внутри категорий.
   */
  featCategories: Array<string>;

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

  /** Уровень, с которого выбор открывается; не задан — сразу. */
  requiredLevel: number | undefined;

  /**
   * Ступени количества по уровням: сколько всего выбирают к каждому уровню.
   * Пусто — количество не растёт и задано `count`.
   */
  scaling: Array<FeatChoiceScaling>;

  /** Показывать количество колонкой таблицы прогрессии класса. */
  showInTable: boolean;

  /** Краткая подпись колонки таблицы; пусто — берётся подпись выбора. */
  shortName: string;

  /**
   * Прибавка к характеристике. Задана — строка поднимает характеристику: в
   * режиме «выдать всё» перечисленные, в режиме выбора — ту, что назвал игрок
   * («Устойчивый» поднимает характеристику своего спасброска).
   */
  abilityBonus: number | undefined;

  /** Предел повышения: 20 у обычных черт, 30 у эпических даров. */
  abilityUpto: number | undefined;

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

/**
 * Откуда строка защиты берёт тип урона: задан автором или назван игроком при
 * взятии черты.
 */
export type FeatModifierRowSource = 'FIXED' | 'CHOICE';

/** Строка модификатора: одна постоянная правка листа. */
export interface FeatModifierRow {
  uid: string;
  kind: FeatModifierRowKind;
  value: number | undefined;
  /** Скорость равна скорости ходьбы; тогда число не нужно. */
  equalsWalk: boolean;

  /** Как задан тип урона у строки защиты. */
  source: FeatModifierRowSource;

  /** Тип урона, заданный автором; только у `source: 'FIXED'`. */
  damageType: string | undefined;

  /**
   * Набор, из которого игрок называет тип урона; только у `source: 'CHOICE'`.
   * Пусто — любой тип урона: перечислять все тринадцать незачем, лист
   * подставит их сам.
   */
  damageTypes: Array<string>;

  /**
   * Машинный ключ выбора: по нему защита ссылается на ответ игрока. Автору не
   * показан — форма заводит его сама, как и у выбора класса заклинаний.
   */
  key: string;

  /** Подпись пикера на листе; пусто — лист подпишет его сам. */
  label: string;

  /** Сколько типов урона называет игрок. */
  count: number | undefined;

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

/** Как задан круг заклинаний порции. */
export type FeatSpellLevelMode = 'ANY' | 'EXACT' | 'UP_TO';

/**
 * Откуда порция берёт пул: `FILTER` — поиском по справочнику по кругу и спискам
 * классов блока, `LIST` — ровно из перечисленных заклинаний.
 */
export type FeatSpellPickSource = 'FILTER' | 'LIST';

/**
 * Порция заклинаний, которую игрок берёт: «два заговора», «одно заклинание
 * первого круга».
 *
 * Порций бывает несколько, а список классов у них общий: «Посвящённый в магию»
 * спрашивает класс один раз и берёт из него и заговоры, и заклинание. Поэтому
 * классы живут в блоке ({@link FeatSpellChoiceBlock}), а не в порции.
 */
export interface FeatSpellPickRow {
  uid: string;

  /** Машинный ключ выбора: по нему лист помнит ответ игрока. Автору не виден. */
  key: string;

  mode: FeatSpellLevelMode;

  /** Круг: точный при `EXACT`, наибольший при `UP_TO`; у `ANY` не задан. */
  level: number | undefined;

  count: number | undefined;
  countEqualsProficiencyBonus: boolean;
  label: string;

  /**
   * Уровень персонажа, с которого спрашивают порцию; не задан — сразу при
   * взятии записи. Нужен умению, которое спрашивает порции на разных уровнях:
   * «Таинственный арканум» колдуна даёт заклинание 6 круга на 11 уровне,
   * 7 круга — на 13, и без уровня лист задал бы все вопросы разом.
   */
  requiredLevel: number | undefined;

  /**
   * Откуда пул. «Таинственный арканум» ищет по кругу и списку колдуна; умение
   * «выберите одно из этих трёх заклинаний» перечисляет их — круг и списки
   * классов у такой порции не спрашиваются, они у каждой записи свои.
   */
  source: FeatSpellPickSource;

  /** Перечисленные заклинания — пул порции при `source: 'LIST'`; иначе пусто. */
  spells: Array<FeatEntityRef>;
}

/**
 * Выбор заклинаний черты целиком.
 *
 * Блок, а не список строк: класс и заклинательная характеристика общие для всех
 * порций, и спрашивать их у каждой порции значило бы спрашивать дважды.
 */
export interface FeatSpellChoiceBlock {
  /**
   * Классы, из чьих списков берутся заклинания. Больше одного — игрок сначала
   * выбирает один из них, и пул сужается до него: по правилам список один, а не
   * объединение перечисленных.
   */
  classes: Array<FeatEntityRef>;

  /** Машинный ключ выбора класса: под ним лист хранит ответ игрока. */
  classChoiceKey: string;

  /**
   * Подпись выбора класса из записи. Форма её не правит, но и терять нельзя:
   * лист показывает её игроку вместо машинного ключа.
   */
  classChoiceLabel: string;

  picks: Array<FeatSpellPickRow>;

  /**
   * Характеристики, из которых считаются заклинания черты — и выданные, и
   * выбранные. Пусто — характеристика берётся от класса; одна — задана жёстко;
   * несколько — игрок выбирает одну из них.
   */
  abilityOptions: Array<AbilityKey>;

  /** Машинный ключ выбора характеристики. */
  abilityChoiceKey: string;

  /** Подпись выбора характеристики из записи — по той же причине, что у класса. */
  abilityChoiceLabel: string;
}

/** Строка ресурса черты. */
export interface FeatCounterRow extends FeatCounter {
  uid: string;
}

/** Механика черты в том виде, в каком её правит форма. */
export interface FeatEditorRows {
  grants: Array<FeatGrantRow>;
  spellChoice: FeatSpellChoiceBlock;
  modifiers: Array<FeatModifierRow>;
  prerequisites: Array<FeatPrerequisiteRow>;
  counters: Array<FeatCounterRow>;

  /**
   * Чувства, вида которых редактор не знает: своей строки им нет, но выкинуть
   * их нельзя — они возвращаются в механику как есть.
   */
  unknownSenses: Array<FeatSenseGrant>;

  /**
   * Защиты, привязанные к выбору, которого в черте больше нет. Строки таким
   * привязкам не построить — но и потерять их нельзя: ссылки уйдут на сервер
   * теми же, какими пришли.
   */
  unlinkedDefenseChoices: Array<FeatDamageDefenseChoice>;
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
  'MASTERY_PROPERTY',
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
  'FEAT',
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
  MASTERY_PROPERTY: 'MASTERY_PROPERTY',
  ABILITY: 'ABILITY',
  DAMAGE_TYPE: 'DAMAGE_TYPE',
  OPTION: 'OPTION',
  FEAT: 'FEAT',
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
  MASTERY_PROPERTY: 'MASTERY_PROPERTY',
  ABILITY: 'ABILITY',
  DAMAGE_TYPE: 'DAMAGE_TYPE',
  OPTION: 'OPTION',
  FEAT: 'FEAT',
};

/** Типы выборов, живущих на вкладке «Заклинания». */
const SPELL_CHOICE_TYPES: Array<FeatChoiceType> = [
  'SPELL',
  'CANTRIP',
  'SPELL_LIST',
  'SPELLCASTING_ABILITY',
];

/** Круг заговора: им заклинание отличается от заговора и в фильтре, и в типе. */
const CANTRIP_LEVEL = 0;

/** Ключ выбора класса по умолчанию. */
const SPELL_LIST_CHOICE_KEY = 'spell-list';

/** Ключ выбора заклинательной характеристики по умолчанию. */
const SPELLCASTING_ABILITY_CHOICE_KEY = 'spellcasting-ability';

/** Ключ выбора типа урона по умолчанию. */
const DAMAGE_TYPE_CHOICE_KEY = 'damage-type';

/** Приставка ключа порции заклинаний. */
const SPELL_PICK_KEY_PREFIX = 'spell';

/** Приставка ключа порции заговоров: так ключ читается без заглядывания в круг. */
const CANTRIP_PICK_KEY_PREFIX = 'cantrip';

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
  MASTERY_PROPERTY: 'mastery-property',
  ABILITY: 'ability',
  DAMAGE_TYPE: DAMAGE_TYPE_CHOICE_KEY,
  OPTION: 'option',
  FEAT: 'feat',
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

/** Называет ли тип урона игрок, а не автор черты. */
export function isDamageDefenseChoiceRow(row: FeatModifierRow): boolean {
  return row.kind === 'DAMAGE_DEFENSE' && row.source === 'CHOICE';
}

/** Задан ли тип урона автором: тогда строке нужен селект одного типа. */
export function isFixedDamageDefenseRow(row: FeatModifierRow): boolean {
  return row.kind === 'DAMAGE_DEFENSE' && row.source === 'FIXED';
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
    ...rows.modifiers.map((row) => row.key.trim()),
    ...rows.spellChoice.picks.map((row) => row.key.trim()),
    rows.spellChoice.classChoiceKey.trim(),
    rows.spellChoice.abilityChoiceKey.trim(),
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
    featCategories: [],
    key: getFreeFeatChoiceKey(CHOICE_KEY_BY_GRANT_KIND[kind], takenKeys),
    label: '',
    count: 1,
    countEqualsProficiencyBonus: false,
    grants: 'PROFICIENCY',
    onlyIfNotProficient: false,
    onlyIfProficient: false,
    expertiseIfProficient: false,
    rechooseOnLongRest: false,
    requiredLevel: undefined,
    scaling: [],
    showInTable: false,
    shortName: '',
    abilityBonus: kind === 'ABILITY' ? 1 : undefined,
    abilityUpto: kind === 'ABILITY' ? 20 : undefined,
    fromChoiceKey: '',
    storedAsChoice: false,
  };
}

/**
 * Новая порция заклинаний. Круг по умолчанию — заговор: с него начинаются почти
 * все черты, дающие заклинания.
 *
 * @param takenKeys ключи выборов, занятые в черте.
 * @returns порция заклинаний.
 */
export function createSpellPickRow(takenKeys: Array<string>): FeatSpellPickRow {
  return {
    uid: nextRowUid('spell-pick'),
    key: getFreeFeatChoiceKey(CANTRIP_PICK_KEY_PREFIX, takenKeys),
    mode: 'EXACT',
    level: CANTRIP_LEVEL,
    count: 1,
    countEqualsProficiencyBonus: false,
    label: '',
    requiredLevel: undefined,
    source: 'FILTER',
    spells: [],
  };
}

/** Пустой выбор заклинаний: черта заклинаний не даёт. */
export function createSpellChoiceBlock(): FeatSpellChoiceBlock {
  return {
    classes: [],
    classChoiceKey: SPELL_LIST_CHOICE_KEY,
    classChoiceLabel: '',
    picks: [],
    abilityOptions: [],
    abilityChoiceKey: SPELLCASTING_ABILITY_CHOICE_KEY,
    abilityChoiceLabel: '',
  };
}

/**
 * Новая строка модификатора листа.
 *
 * @param kind вид модификатора.
 * @param takenKeys ключи выборов, занятые в черте: защита в режиме выбора
 *   заводит свой выбор и не должна отобрать ключ у чужого.
 * @returns строка модификатора.
 */
export function createModifierRow(
  kind: FeatModifierRowKind,
  takenKeys: Array<string> = [],
): FeatModifierRow {
  return {
    uid: nextRowUid('modifier'),
    kind,
    value: hasModifierValue(kind) ? 0 : undefined,
    equalsWalk: false,
    source: 'FIXED',
    damageType: undefined,
    damageTypes: [],
    key:
      kind === 'DAMAGE_DEFENSE'
        ? getFreeFeatChoiceKey(DAMAGE_TYPE_CHOICE_KEY, takenKeys)
        : '',
    label: '',
    count: 1,
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
    scaling: [],
    min: 0,
    showInTable: false,
    recovery: 'LONG_REST',
  };
}

/** Пустые строки редактора: черта на лист не влияет. */
export function createFeatEditorRows(): FeatEditorRows {
  return {
    grants: [],
    spellChoice: createSpellChoiceBlock(),
    modifiers: [],
    prerequisites: [],
    counters: [],
    unknownSenses: [],
    unlinkedDefenseChoices: [],
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
    featCategories: [...(choice.featCategories ?? [])],
    key: choice.key,
    label: choice.label,
    count: choice.count,
    countEqualsProficiencyBonus: choice.countEqualsProficiencyBonus,
    grants: choice.grants ?? 'PROFICIENCY',
    onlyIfNotProficient: choice.onlyIfNotProficient,
    onlyIfProficient: choice.onlyIfProficient,
    expertiseIfProficient: choice.expertiseIfProficient,
    rechooseOnLongRest: choice.rechooseOnLongRest,
    requiredLevel: choice.requiredLevel,
    scaling: (choice.scaling ?? []).map((step) => ({ ...step })),
    showInTable: choice.showInTable ?? false,
    shortName: choice.shortName ?? '',
    abilityBonus: undefined,
    abilityUpto: undefined,
    fromChoiceKey: '',
    storedAsChoice: kinds.includes('ABILITY'),
  };
}

/**
 * Порция заклинаний из выбора черты.
 *
 * Круг задан либо точно, либо потолком: фильтр разрешает оба поля разом, но
 * значит это то же самое, что один точный круг — так его читает и лист
 * персонажа. Поэтому точный круг сильнее потолка.
 *
 * @param choice выбор заклинания или заговора.
 * @returns порция заклинаний.
 */
function toSpellPickRow(choice: FeatChoice): FeatSpellPickRow {
  const filter = choice.spellFilter;

  // Тип `CANTRIP` задаёт круг сам: у выбора заговора фильтра круга может не
  // быть вовсе, и без этого он прочитался бы как заклинание любого круга
  const exactLevel =
    filter?.level ?? (choice.type === 'CANTRIP' ? CANTRIP_LEVEL : undefined);

  const level = exactLevel ?? filter?.maxLevel;

  let mode: FeatSpellLevelMode = 'ANY';

  if (exactLevel !== undefined) {
    mode = 'EXACT';
  } else if (filter?.maxLevel !== undefined) {
    mode = 'UP_TO';
  }

  // Перечисленные заклинания лежат в наборе значений выбора: значение — url
  // записи, имя — снимок названия из редактора
  const spells = choice.options
    .filter((option) => !!option.value.trim())
    .map((option) => ({
      url: option.value.trim(),
      ...(option.name ? { name: option.name } : {}),
    }));

  return {
    uid: nextRowUid('spell-pick'),
    key: choice.key,
    mode,
    level,
    count: choice.count,
    countEqualsProficiencyBonus: choice.countEqualsProficiencyBonus,
    label: choice.label,
    requiredLevel: choice.requiredLevel,
    source: spells.length ? 'LIST' : 'FILTER',
    spells,
  };
}

/**
 * Выбор заклинаний блоком из выборов черты.
 *
 * Классы берутся из выбора класса, а если его нет — из фильтра первой порции:
 * так читается и черта с одним списком, у которой спрашивать нечего.
 * Заклинательная характеристика — из выбора, а без него из жёстко заданной в
 * выдаче заклинаний.
 *
 * @param choices выборы черты.
 * @param spells выдача заклинаний черты.
 * @returns блок выбора заклинаний.
 */
function toSpellChoiceBlock(
  choices: Array<FeatChoice>,
  spells: FeatSpellGrant,
): FeatSpellChoiceBlock {
  const block = createSpellChoiceBlock();

  const classChoice = choices.find((choice) => choice.type === 'SPELL_LIST');

  const abilityChoice = choices.find(
    (choice) => choice.type === 'SPELLCASTING_ABILITY',
  );

  const spellChoices = choices.filter(
    (choice) => choice.type === 'SPELL' || choice.type === 'CANTRIP',
  );

  if (classChoice) {
    block.classChoiceKey = classChoice.key || block.classChoiceKey;
    block.classChoiceLabel = classChoice.label;

    block.classes = classChoice.options.map((option) => ({
      url: option.value,
      ...(option.name ? { name: option.name } : {}),
    }));
  } else {
    const listed = spellChoices.find(
      (choice) => choice.spellFilter?.classes.length,
    );

    block.classes = (listed?.spellFilter?.classes ?? []).map((reference) => ({
      ...reference,
    }));
  }

  if (abilityChoice) {
    block.abilityChoiceKey = abilityChoice.key || block.abilityChoiceKey;
    block.abilityChoiceLabel = abilityChoice.label;

    block.abilityOptions = abilityChoice.options
      .map((option) => option.value)
      .filter((value): value is AbilityKey => isAbilityKey(value));
  } else if (spells.spellcastingAbility) {
    block.abilityOptions = [spells.spellcastingAbility];
  }

  block.picks = spellChoices.map(toSpellPickRow);

  return block;
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
    ['MASTERY_PROPERTY', proficiencies.masteryProperties],
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
    // Черты без выбора лежат не во владениях, а своим блоком: владением черта
    // не является, но строкой дара читается так же — «выдать всё»
    ['FEAT', mechanics.feats ?? []],
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

/**
 * Защиты по выбору игрока: список ссылок, а у записей до его появления —
 * развёрнутое легаси-поле. Читается что-то одно: список сильнее, потому что
 * форма пишет легаси-поле по нему же, и разойтись они могут только в записи,
 * пришедшей от другого потребителя.
 *
 * @param damage отношение черты к типам урона.
 * @returns защиты по выбору игрока с очищенными ключами.
 */
function toDefenseChoices(
  damage: FeatDamageAffinity,
): Array<FeatDamageDefenseChoice> {
  const listed = damage.defenseChoices.flatMap((choice) => {
    const choiceKey = choice.choiceKey.trim();

    return choiceKey ? [{ choiceKey, kind: choice.kind }] : [];
  });

  if (listed.length) {
    return listed;
  }

  const legacy = damage.resistanceFromChoiceKey.trim();

  return legacy ? [{ choiceKey: legacy, kind: 'RESISTANCE' }] : [];
}

/**
 * Строки модификаторов из постоянных правок листа.
 *
 * Защита по выбору игрока описана в механике двумя записями — ссылкой в
 * модификаторах и самим выбором в `choices`, — а в форме это одна строка:
 * автор настраивает защиту целиком в одном месте. Поэтому разбору нужны и
 * выборы, а не одни модификаторы.
 */
function toModifierRows(mechanics: FeatMechanics): {
  rows: Array<FeatModifierRow>;
  unknownSenses: Array<FeatSenseGrant>;
  /** Ключи выборов, уехавших в строки защиты: строки дара им уже не нужны. */
  defenseChoiceKeys: Set<string>;
  unlinkedDefenseChoices: Array<FeatDamageDefenseChoice>;
} {
  const rows: Array<FeatModifierRow> = [];
  const unknownSenses: Array<FeatSenseGrant> = [];
  const defenseChoiceKeys = new Set<string>();
  const seenChoiceKeys = new Set<string>();
  const unlinkedDefenseChoices: Array<FeatDamageDefenseChoice> = [];

  const push = (
    kind: FeatModifierRowKind,
    patch: Partial<FeatModifierRow> = {},
  ): void => {
    rows.push({ ...createModifierRow(kind), ...patch });
  };

  const { modifiers } = mechanics;
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
      // Ключ фиксированной строке не нужен: он ничего не адресует, а свободный
      // ключ ей выделит `resolveKey`, если автор переведёт её в режим выбора
      push('DAMAGE_DEFENSE', { damageType, defenseKind, key: '' });
    }
  }

  for (const defenseChoice of toDefenseChoices(damage)) {
    // Два исхода у одного ответа — противоречие: тип урона не бывает разом и
    // уязвимым, и стойким. Лишняя ссылка отбрасывается, иначе выбор уехал бы в
    // механику дважды под одним ключом
    if (seenChoiceKeys.has(defenseChoice.choiceKey)) {
      continue;
    }

    seenChoiceKeys.add(defenseChoice.choiceKey);

    const choice = mechanics.choices.find(
      (entry) => entry.key === defenseChoice.choiceKey,
    );

    // Строкой защиты показывается только чистый выбор типа урона: смешанный
    // («навык ИЛИ тип урона») она обрезала бы до одного вида. Такой выбор
    // остаётся строкой дара, а ссылка на него — непривязанной
    if (
      !choice
      || choice.type !== 'DAMAGE_TYPE'
      || (choice.types?.length ?? 0) > 1
    ) {
      unlinkedDefenseChoices.push({ ...defenseChoice });

      continue;
    }

    defenseChoiceKeys.add(choice.key);

    push('DAMAGE_DEFENSE', {
      source: 'CHOICE',
      defenseKind: defenseChoice.kind,
      damageTypes: choice.options.map((option) => option.value),
      key: choice.key,
      label: choice.label,
      count: choice.count ?? 1,
    });
  }

  for (const condition of modifiers.conditionImmunities) {
    push('CONDITION_IMMUNITY', { condition });
  }

  if (modifiers.creatureType) {
    push('CREATURE_TYPE', { creatureType: modifiers.creatureType });
  }

  return { rows, unknownSenses, defenseChoiceKeys, unlinkedDefenseChoices };
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

  // Модификаторы разбираются первыми: выбор типа урона, к которому привязана
  // защита, уезжает в её строку целиком — своей строки дара у него уже нет
  const modifiers = toModifierRows(mechanics);

  rows.modifiers = modifiers.rows;
  rows.unknownSenses = modifiers.unknownSenses;
  rows.unlinkedDefenseChoices = modifiers.unlinkedDefenseChoices;

  rows.grants = toFixedGrantRows(mechanics);

  rows.spellChoice = toSpellChoiceBlock(mechanics.choices, mechanics.spells);

  for (const choice of mechanics.choices) {
    if (choice.type && SPELL_CHOICE_TYPES.includes(choice.type)) {
      continue;
    }

    if (modifiers.defenseChoiceKeys.has(choice.key)) {
      continue;
    }

    const row = toChoiceGrantRow(choice);

    if (row) {
      rows.grants.push(row);
    }
  }

  for (const bonus of mechanics.abilityBonuses ?? []) {
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

  rows.prerequisites = toPrerequisiteRows(prerequisite);

  rows.counters = mechanics.counters.map((counter) => ({
    ...counter,
    uid: nextRowUid('counter'),
  }));

  return rows;
}

/** Общие поля выбора: подпись, количество, набор, отдых и уровень открытия. */
function toBaseChoice(
  row: {
    label: string;
    count: number | undefined;
    countEqualsProficiencyBonus: boolean;
    options: Array<FeatChoiceOption>;
    rechooseOnLongRest: boolean;
    requiredLevel?: number | undefined;
    scaling?: Array<FeatChoiceScaling>;
    showInTable?: boolean;
    shortName?: string;
  },
  key: string,
  type: FeatChoiceType,
): FeatChoice {
  // Ступень без уровня или без количества ничего не описывает: у потребителя
  // она превратилась бы в выбор ни из чего
  const scaling = (row.scaling ?? [])
    .filter((step) => step.level > 0 && step.count > 0)
    .sort((left, right) => left.level - right.level);

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
    featCategories: undefined,
    onlyIfProficient: false,
    grants: undefined,
    expertiseIfProficient: false,
    rechooseOnLongRest: row.rechooseOnLongRest,
    requiredLevel: row.requiredLevel,
    scaling: scaling.length ? scaling : undefined,
    // Колонка выводится из ступеней: без них показывать в таблице нечего
    showInTable: scaling.length && row.showInTable ? true : undefined,
    shortName: row.shortName?.trim() || undefined,
  };
}

/** Выбор без заполненных полей: с него начинается сборка выборов заклинаний. */
function createEmptyChoice(key: string, type: FeatChoiceType): FeatChoice {
  return {
    key,
    type,
    types: undefined,
    label: '',
    count: 1,
    countEqualsProficiencyBonus: false,
    options: [],
    spellFilter: undefined,
    onlyIfNotProficient: false,
    featCategories: undefined,
    onlyIfProficient: false,
    grants: undefined,
    expertiseIfProficient: false,
    scaling: undefined,
    showInTable: undefined,
    shortName: undefined,
    rechooseOnLongRest: false,
    requiredLevel: undefined,
  };
}

/** Классы блока набором значений выбора: снимок названия остаётся при ссылке. */
function toClassOptions(
  classes: Array<FeatEntityRef>,
): Array<FeatChoiceOption> {
  return classes.map((reference) => ({
    value: reference.url.trim(),
    ...(reference.name ? { name: reference.name } : {}),
  }));
}

/**
 * Выборы механики из блока выбора заклинаний.
 *
 * Выбор класса заводится, только когда классов больше одного: с единственным
 * списком спрашивать нечего — пул задан фильтром напрямую. Порция заговоров
 * пишется типом `CANTRIP`: так её читает потребитель, не заглядывая в фильтр.
 *
 * Порядок выборов — тот, в каком их задаёт игроку лист: сперва класс, потом
 * заклинания, потом характеристика.
 *
 * @param block блок выбора заклинаний.
 * @param resolveKey выдача свободного ключа выбора.
 * @returns выборы черты.
 */
function toSpellChoices(
  block: FeatSpellChoiceBlock,
  resolveKey: (key: string, preferred: string) => string,
): Array<FeatChoice> {
  const classes = block.classes.filter((reference) => !!reference.url.trim());

  const used = new Set<string>();

  /**
   * Ключ выбора, не совпавший с уже занятым в блоке. Записи бывают битые:
   * у «Посвящённого в магию» на деве выбор заговоров лежит под ключом
   * `spellcasting-ability`, и без проверки он схлопнулся бы с выбором
   * характеристики.
   */
  const takeKey = (key: string, preferred: string): string => {
    const resolved = resolveKey(key, preferred);

    const free = used.has(resolved) ? resolveKey('', preferred) : resolved;

    used.add(free);

    return free;
  };

  // Класс спрашивается только ради заклинаний, которые ищут по его списку: без
  // единой такой строки он ничего не сужает, и игроку пришлось бы отвечать
  // впустую. Порции с перечисленными заклинаниями списка класса не читают
  const hasFilterPicks = block.picks.some((pick) => pick.source === 'FILTER');

  const classChoiceKey =
    classes.length > 1 && hasFilterPicks
      ? takeKey(block.classChoiceKey, SPELL_LIST_CHOICE_KEY)
      : '';

  const abilityChoiceKey =
    block.abilityOptions.length > 1
      ? takeKey(block.abilityChoiceKey, SPELLCASTING_ABILITY_CHOICE_KEY)
      : '';

  const choices: Array<FeatChoice> = [];

  if (classChoiceKey) {
    choices.push({
      ...createEmptyChoice(classChoiceKey, 'SPELL_LIST'),
      label: block.classChoiceLabel.trim(),
      options: toClassOptions(classes),
    });
  }

  for (const pick of block.picks) {
    const isList = pick.source === 'LIST';

    // У перечисленных заклинаний круг свой у каждой записи, поэтому порция
    // пишется общим типом SPELL, даже если в ней одни заговоры
    const isCantrip =
      !isList && pick.mode === 'EXACT' && pick.level === CANTRIP_LEVEL;

    const key = takeKey(
      pick.key,
      isCantrip ? CANTRIP_PICK_KEY_PREFIX : SPELL_PICK_KEY_PREFIX,
    );

    // Перечисленные заклинания — набором значений выбора, как черты у выбора
    // черты: значение — url, имя — снимок названия для подписи
    const listed = pick.spells
      .filter((spell) => !!spell.url.trim())
      .map((spell) => ({
        value: spell.url.trim(),
        ...(spell.name ? { name: spell.name } : {}),
      }));

    choices.push({
      ...createEmptyChoice(key, isCantrip ? 'CANTRIP' : 'SPELL'),
      label: pick.label.trim(),
      count: pick.count,
      countEqualsProficiencyBonus: pick.countEqualsProficiencyBonus,
      requiredLevel: pick.requiredLevel,
      options: isList ? listed : [],
      // Фильтра у перечисленного пула нет: круг и класс берутся из записей
      spellFilter: isList
        ? undefined
        : {
            level: pick.mode === 'EXACT' ? pick.level : undefined,
            maxLevel: pick.mode === 'UP_TO' ? pick.level : undefined,
            classes,
            classesFromChoiceKey: classChoiceKey,
          },
    });
  }

  // Характеристика спрашивается последней: она относится ко всем заклинаниям
  // черты сразу, а не к какой-то одной порции
  if (abilityChoiceKey) {
    // Названия вариантов — из справочника характеристик: их читает лист, а
    // редактор хранит только ключи
    choices.push({
      ...createEmptyChoice(abilityChoiceKey, 'SPELLCASTING_ABILITY'),
      label: block.abilityChoiceLabel.trim(),
      options: block.abilityOptions.map((ability) => ({
        value: ability,
        name: ABILITY_LABELS[ability],
      })),
    });
  }

  return choices;
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
    // Категории есть только у выбора черты; пустой список не пишется — его
    // отсутствие и значит «любая категория»
    featCategories:
      primary === 'FEAT' && row.featCategories.length
        ? [...row.featCategories]
        : undefined,
    // Исход по умолчанию не пишется: у записей до его появления поля нет, и
    // core-api читает его отсутствие как владение
    grants: isExpertise && row.grants === 'EXPERTISE' ? 'EXPERTISE' : undefined,
    expertiseIfProficient: isExpertise && row.expertiseIfProficient,
  };
}

/**
 * Выбор типа урона из строки защиты.
 *
 * Пустой набор — любой тип урона: перечислять все тринадцать в каждой такой
 * черте незачем, лист подставит их сам. Пересмотра на отдыхе у защиты не
 * бывает: сопротивление, которое меняется каждый день, — это условный эффект,
 * и его место в описании.
 */
function toDamageDefenseChoice(row: FeatModifierRow, key: string): FeatChoice {
  return toBaseChoice(
    {
      label: row.label,
      count: row.count,
      countEqualsProficiencyBonus: false,
      options: toDictionaryOptions(row.damageTypes),
      rechooseOnLongRest: false,
    },
    key,
    'DAMAGE_TYPE',
  );
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
    case 'MASTERY_PROPERTY':
      proficiencies.masteryProperties.push(...values);

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
    case 'FEAT':
      mechanics.feats = [...(mechanics.feats ?? []), ...toRefs(row.options)];

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
        // Тип урона по выбору игрока в наборы не ложится: он ещё не назван.
        // Такая строка уходит ссылкой на выбор — см. `fromFeatEditorRows`
        if (isDamageDefenseChoiceRow(row)) {
          break;
        }

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
  const abilityBonuses: Array<FeatAbilityBonus> = [];

  mechanics.abilityBonuses = abilityBonuses;

  // Характеристика одна на все заклинания черты: заданную жёстко (ровно одну в
  // блоке) держит выдача заклинаний, выбор из нескольких — отдельный выбор
  mechanics.spells = {
    ...base.spells,
    spellcastingAbility:
      rows.spellChoice.abilityOptions.length === 1
        ? rows.spellChoice.abilityOptions[0]
        : undefined,
  };

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

  for (const row of rows.grants) {
    const primary = getPrimaryGrantKind(row);

    // Повышение характеристик само по себе и есть выбор: набор, количество и
    // прибавка описаны одной записью, отдельный выбор ей не нужен
    if (primary === 'ABILITY' && !row.storedAsChoice) {
      const bonus = toAbilityBonus(row, row.fromChoiceKey.trim());

      if (bonus) {
        abilityBonuses.push(bonus);
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
        abilityBonuses.push(bonus);
      }
    }
  }

  // Строка защиты в режиме выбора описывает его целиком: отдельной строки дара
  // у такого выбора нет, поэтому и сам выбор, и ссылку на него заводит она
  const defenseChoices: Array<FeatDamageDefenseChoice> =
    rows.unlinkedDefenseChoices.map((choice) => ({ ...choice }));

  for (const row of rows.modifiers) {
    if (!isDamageDefenseChoiceRow(row)) {
      continue;
    }

    const key = resolveKey(row.key, DAMAGE_TYPE_CHOICE_KEY);

    mechanics.choices.push(toDamageDefenseChoice(row, key));
    defenseChoices.push({ choiceKey: key, kind: row.defenseKind });
  }

  mechanics.choices.push(...toSpellChoices(rows.spellChoice, resolveKey));

  mechanics.modifiers = toModifiers(rows.modifiers, rows.unknownSenses);
  mechanics.modifiers.damage.defenseChoices = defenseChoices;

  // Легаси-поле: первая защита, дающая сопротивление. Иммунитета и уязвимости
  // по выбору оно не знает — их читают только из `defenseChoices`
  mechanics.modifiers.damage.resistanceFromChoiceKey =
    defenseChoices.find((choice) => choice.kind === 'RESISTANCE')?.choiceKey
    ?? '';

  mechanics.counters = rows.counters.map((row) => ({
    key: row.key.trim(),
    name: row.name.trim(),
    shortName: row.shortName.trim(),
    max: row.max.trim(),
    // Ступень без уровня или без максимума ничего не описывает: у потребителя
    // она превратилась бы в ресурс на ноль зарядов
    scaling: row.scaling
      .filter((step) => step.level > 0 && step.max > 0)
      .sort((left, right) => left.level - right.level),
    // Отрицательная нижняя граница ничего не описывает: ресурса меньше чем на
    // ноль зарядов не бывает
    min: Math.max(0, Math.trunc(row.min)),
    showInTable: row.showInTable,
    recovery: row.recovery,
  }));

  return {
    mechanics,
    prerequisiteDetails: toPrerequisiteDetails(rows.prerequisites),
  };
}
