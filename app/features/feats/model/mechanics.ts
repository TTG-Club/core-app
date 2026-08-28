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
  | 'WEAPON_MASTERY'
  | 'ARMOR'
  | 'OPTION'
  | 'FEAT';

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

/**
 * Чем ограничен выбор заклинания или заговора.
 *
 * Круг задан одним из двух полей: `level` — ровно этот круг, `maxLevel` — этот
 * и ниже. Оба пусты — круг не ограничен.
 */
export interface FeatSpellFilter {
  level: number | undefined;
  maxLevel: number | undefined;

  /** Классы, из списков заклинаний которых можно выбирать. */
  classes: Array<FeatEntityRef>;

  /**
   * Ключ выбора, из ответа на который берётся класс. «Посвящённый в магию»
   * сначала спрашивает список — жреца, друида или волшебника, — и только потом
   * даёт выбрать из него заговоры: пул сужается до выбранного класса, а не до
   * всех трёх. Пусто — пул задан `classes` напрямую.
   *
   * Автор этот ключ не задаёт: форма пишет его сама, когда классов в выборе
   * больше одного (см. `fromFeatEditorRows`).
   */
  classesFromChoiceKey: string;
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

  /**
   * Все виды выбора, когда их несколько: «Умелый» даёт выбрать три штуки из
   * навыков И инструментов вперемешку, а не три навыка и отдельно три
   * инструмента. Пусто — вид один и задан `type`.
   *
   * `type` при этом остаётся заполненным первым из видов: потребители, не
   * знающие о смешанном выборе, читают его и получают осмысленный, пусть и
   * суженный, пул.
   */
  types: Array<FeatChoiceType> | undefined;

  label: string;
  count: number | undefined;
  countEqualsProficiencyBonus: boolean;
  options: Array<FeatChoiceOption>;
  spellFilter: FeatSpellFilter | undefined;
  onlyIfNotProficient: boolean;

  /**
   * Категории черт, из которых выбирают, — только у выбора черты (`FEAT`).
   * `undefined` — категория не ограничена либо выбор не про черты.
   *
   * Складывается с `options`: перечисленные черты сужают пул внутри категорий,
   * а без перечисления пул — все черты названных категорий. Так «Боевой стиль»
   * воина описывается одной категорией и не требует перечислять стили, которые
   * ещё допишут в справочник.
   */
  featCategories: Array<string> | undefined;

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

  /**
   * Уровень персонажа, с которого выбор открывается; `undefined` — сразу.
   *
   * Нужен умению, которое спрашивает одно и то же не один раз: компетентность
   * плут получает на первом уровне и ещё раз на шестом, бард — на втором и на
   * девятом. Второго умения под это в книге нет — повтор описан строкой роста,
   * — поэтому уровень стоит у самого выбора.
   */
  requiredLevel: number | undefined;
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

/** Вид защиты от урона: что тип урона получает. */
export type FeatDamageDefenseKind = 'RESISTANCE' | 'IMMUNITY' | 'VULNERABILITY';

/**
 * Защита от типа урона, который называет игрок.
 *
 * Сам тип известен только после выбора, поэтому в наборы {@link FeatDamageAffinity}
 * такая защита лечь не может: здесь ссылка на выбор из `choices` и исход, который
 * выбор даёт. «Закалённая кожа» просит выбрать дробящий или рубящий и даёт к
 * названному сопротивление, «Дар устойчивости к энергиям» — два типа сразу.
 */
export interface FeatDamageDefenseChoice {
  choiceKey: string;
  kind: FeatDamageDefenseKind;
}

/** Сопротивления, иммунитеты и уязвимости к урону. */
export interface FeatDamageAffinity {
  resistances: Array<string>;
  immunities: Array<string>;
  vulnerabilities: Array<string>;

  /** Защиты от типов урона, которые называет игрок. */
  defenseChoices: Array<FeatDamageDefenseChoice>;

  /**
   * Легаси-псевдоним первой записи `defenseChoices` с видом `RESISTANCE`: до появления
   * списка выбор мог дать только сопротивление и только один. Форма пишет его вместе со
   * списком — его читают потребители, до которых новое поле ещё не доехало.
   */
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
 */
export interface FeatProficiencyGrant {
  /** Категории оружия справочника (`MATERIAL_MELEE` и подобные). */
  weaponCategories: Array<string>;

  /**
   * Конкретные виды оружия из раздела «Предметы»: «Мастер оружия» выдаёт
   * владение не категорией, а перечисленными видами. Категориями такое не
   * записать — они шире.
   */
  weapons: Array<FeatEntityRef>;

  /**
   * Оружейные приёмы — ссылками на те же предметы-оружие: приём называется по
   * виду оружия, которым владеешь («Дурнота» у рапиры).
   *
   * Отдельным полем от `weapons`, потому что на листе это отдельный список
   * владений, а не подмножество владения оружием: приёмом можно владеть, не
   * имея владения видом, и наоборот.
   */
  weaponMasteries: Array<FeatEntityRef>;

  /**
   * Спасброски, которыми черта даёт владеть без выбора: «Крепыш» выдаёт
   * владение спасбросками Телосложения.
   */
  savingThrows: Array<AbilityKey>;

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
 * Ссылка на выдаваемое заклинание вместе с уровнем, с которого оно доступно.
 *
 * Своим типом, а не полем в общем {@link FeatEntityRef}: тем же типом описаны
 * требуемые черты, классы и виды, а уровня у них не бывает.
 */
export interface FeatGrantedSpellRef extends FeatEntityRef {
  /**
   * Уровень персонажа, с которого заклинание доступно. `undefined` — с момента
   * взятия черты; так же читаются ссылки, сохранённые до появления поля.
   *
   * У «Метки исцеления» «Лечение ран» есть с первого уровня, а «Малое
   * восстановление» — только с третьего. Без уровня лист выдал бы весь список
   * сразу, и черта оказалась бы сильнее книжной.
   */
  requiredLevel?: number;
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
  spells: Array<FeatGrantedSpellRef>;

  /**
   * Характеристика для расчёта Сл и атаки заклинаний черты — и выданных, и
   * выбранных игроком. Пишется, когда характеристика задана жёстко: если черта
   * даёт выбрать её из нескольких, вместо неё заводится выбор
   * `SPELLCASTING_ABILITY`, а здесь остаётся `undefined`.
   *
   * `undefined` — черта характеристику не задаёт: тогда лист берёт
   * характеристику того класса, чья это магия.
   */
  spellcastingAbility: AbilityKey | undefined;

  /** Заклинание всегда подготовлено и не занимает ячейку подготовки. */
  alwaysPrepared: boolean;
}

/**
 * Заклинания, которые черта добавляет в список заклинаний класса — таблица
 * «Заклинания метки» у черт метки дракона.
 *
 * Отдельным блоком от {@link FeatSpellGrant}, потому что это другая механика.
 * Выданное заклинание игрок знает и накладывает; заклинание отсюда он только
 * МОЖЕТ подготовить наравне с классовыми, потратив на него подготовку и ячейку.
 * Свалить их в одну кучу значило бы выдать «Метке исцеления» девять готовых
 * заклинаний вместо двух.
 *
 * Круг заклинания здесь не хранится, хотя в книге таблица разбита по кругам:
 * круг — свойство самой записи справочника, и снимок разошёлся бы с каталогом
 * при первой же правке. Таблицу группирует по кругам потребитель, взяв круг из
 * записи (`spellListSpells` детали).
 */
export interface FeatSpellListGroup {
  /**
   * Уровень персонажа, с которого список открывается. `undefined` — с момента
   * взятия черты.
   *
   * Ради него списков и несколько: у метки дракона первая пачка приходит сразу,
   * следующая — на пятом уровне, и так далее.
   */
  requiredLevel?: number;

  /**
   * Сколько заклинаний из списка игрок берёт. Пусто — весь список целиком.
   *
   * Формулой, а не числом: у части черт количество привязано к бонусу
   * мастерства или к модификатору характеристики и растёт вместе с персонажем.
   * Грамматика та же, что у максимума ресурса и у активных эффектов: число,
   * `@prof`, `@level`, `@mod.<abbr>` — второй диалект того же смысла разошёлся
   * бы с первым.
   */
  count: string;

  /** Заклинания списка. Круг берётся из самой записи справочника. */
  spells: Array<FeatEntityRef>;
}

export interface FeatSpellListExpansion {
  /**
   * Списки заклинаний по уровням доступа. Несколько — это НЕ «или»: каждый
   * открывается на своём уровне и складывается с предыдущими.
   */
  groups: Array<FeatSpellListGroup>;

  /**
   * Список расширяется, только если у персонажа есть «Использование заклинаний»
   * или «Магия договора». Так написано у всех черт метки дракона; выключено —
   * расширяет всегда.
   */
  requiresSpellcasting: boolean;
}

/**
 * Каким отдыхом восстанавливается ресурс.
 *
 * Короткий отдых в правилах короче продолжительного, поэтому ресурс, который
 * вернул короткий, возвращает и продолжительный: `SHORT_REST` и
 * `SHORT_REST_ONE` различаются только порцией короткого отдыха — целиком или
 * один заряд («Второе дыхание» и «Вдохновение барда» правил 2024 года).
 */
export type FeatCounterRecovery = 'SHORT_REST' | 'LONG_REST' | 'SHORT_REST_ONE';

/**
 * Ресурс черты со счётчиком: очки удачи «Удачливого», применения «Целителя».
 *
 * Максимум записан формулой, а не числом: у большинства таких запасов он привязан
 * к бонусу мастерства и обязан расти вместе с ним («Удачливый» даёт очков удачи
 * столько же, сколько бонус мастерства).
 */
/** Ступень максимума ресурса: с какого уровня сколько зарядов. */
export interface FeatCounterScaling {
  /** Уровень персонажа, с которого действует ступень. */
  level: number;

  /** Максимум зарядов на этой ступени. */
  max: number;
}

export interface FeatCounter {
  /** Стабильный ключ: по нему лист хранит потраченный остаток. */
  key: string;
  name: string;
  /** Краткое название для компактной плитки; пусто — берётся `name`. */
  shortName: string;
  /** Формула максимума: число, `@prof`, `@level`, `@mod.<abbr>`. */
  max: string;

  /**
   * Ступени максимума по уровням; пусто — максимум задан формулой.
   *
   * Нужны ресурсу, ряд которого формулой не пишется: костей превосходства
   * мастера боевых искусств четыре с третьего уровня, пять с седьмого и шесть
   * с пятнадцатого. Заполнены обе формы — старшей считается ступень.
   */
  scaling: Array<FeatCounterScaling>;

  /**
   * Нижняя граница максимума: сколько зарядов у ресурса есть в любом случае;
   * 0 — границы нет.
   *
   * Нужна ресурсам, чей максимум считается модификатором характеристики:
   * вдохновение барда равно модификатору Харизмы, но не меньше одного, и с
   * Харизмой +0 бард всё равно вдохновляет один раз. С формулой не
   * складывается, а подпирает её снизу.
   */
  min: number;

  recovery: FeatCounterRecovery;
}

/** Механика черты целиком. */
export interface FeatMechanics {
  /**
   * Варианты повышения характеристик. Необязательны: у класса и вида такого
   * блока нет вовсе, и core-api падает на ПУСТОМ списке (setterless-свойство
   * без значения) — перед отправкой пустой блок опускается целиком.
   */
  abilityBonuses?: Array<FeatAbilityBonus>;
  choices: Array<FeatChoice>;
  modifiers: FeatModifiers;
  proficiencies: FeatProficiencyGrant;
  spells: FeatSpellGrant;

  /** Заклинания, которые черта добавляет в список заклинаний класса. */
  spellList: FeatSpellListExpansion;

  /** Ресурсы черты со своим счётчиком на листе. */
  counters: Array<FeatCounter>;

  /**
   * Черты, которые выдаются без выбора, — ссылками на записи справочника.
   *
   * Необязательны по той же причине, что и `abilityBonuses`: блок есть только
   * у умения класса, а у черты и вида его нет, и core-api падает на пустом
   * списке — перед отправкой пустой блок опускается целиком.
   */
  feats?: Array<FeatEntityRef>;
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
    types: undefined,
    label: '',
    count: 1,
    countEqualsProficiencyBonus: false,
    options: [],
    spellFilter: undefined,
    onlyIfNotProficient: false,
    featCategories: undefined,
    onlyIfProficient: false,
    grants: 'PROFICIENCY',
    expertiseIfProficient: false,
    rechooseOnLongRest: false,
    requiredLevel: undefined,
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
      defenseChoices: [],
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
    weapons: [],
    weaponMasteries: [],
    savingThrows: [],
    armorCategories: [],
    skills: [],
    languages: [],
    tools: [],
  };
}

/** Новый ресурс черты. */
export function createFeatCounter(): FeatCounter {
  return {
    key: '',
    name: '',
    shortName: '',
    max: '@prof',
    scaling: [],
    min: 0,
    recovery: 'LONG_REST',
  };
}

/** Новый список заклинаний. */
export function createFeatSpellListGroup(): FeatSpellListGroup {
  return {
    requiredLevel: undefined,
    count: '',
    spells: [],
  };
}

/** Пустое расширение списка заклинаний. */
export function createFeatSpellList(): FeatSpellListExpansion {
  return {
    groups: [],
    // Выключено, как и на бэке: пустое поле читается как «расширяет всегда».
    // Заодно пустой блок остаётся пустым и не тянет за собой всю механику
    requiresSpellcasting: false,
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
    spellList: createFeatSpellList(),
    counters: [],
    feats: [],
  };
}
