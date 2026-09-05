import type { SelectOption } from '~/shared/types';

import type { FeatDamageDefenseKind } from './mechanics';
import type {
  FeatGrantedSpellLevelMode,
  FeatGrantedSpellSource,
  FeatGrantRowKind,
  FeatGrantRowMode,
  FeatModifierRowKind,
  FeatModifierRowSource,
  FeatPrerequisiteRowKind,
  FeatSpellLevelMode,
  FeatSpellPickSource,
} from './rows';

import { range } from 'es-toolkit';

/** Значение селекта круга «любой круг»: круг фильтром не ограничен. */
const FEAT_SPELL_ANY_LEVEL_VALUE = 'ANY';

/** Приставка значения селекта «ровно этот круг». */
const FEAT_SPELL_EXACT_LEVEL_PREFIX = 'EXACT:';

/** Приставка значения селекта «этот круг и ниже». */
const FEAT_SPELL_UP_TO_LEVEL_PREFIX = 'UP_TO:';

/** Подписи полей вкладки «Основное». */
export const FEAT_MAIN_TAB_LABELS = {
  detailsTitle: 'Подробности',
  category: 'Категория',
  repeatability: 'Повторяемость',
  repeatabilityCheckbox: 'Можно брать несколько раз',
  descriptionTitle: 'Описание',
  description: 'Описание',
  descriptionPlaceholder: 'Введи описание',
} as const;

/**
 * Категория черт происхождения: их даёт предыстория, и только их предлагает её
 * форма — общая черта в списке предыстории была бы ошибкой правил.
 */
export const ORIGIN_FEAT_CATEGORIES: Array<string> = ['ORIGIN'];

/** Вкладки редактора черты. */
export const FEAT_EDITOR_TABS = {
  main: 'Основное',
  grants: 'Владения',
  spells: 'Заклинания',
  automation: 'Автоматизация',
  prerequisites: 'Требования',
  effects: 'Эффекты',
} as const;

/** Классовые умения, которых может требовать черта. */
export const CLASS_FEATURE_REQUIREMENT_OPTIONS: Array<SelectOption> = [
  { label: 'Использование заклинаний', value: 'SPELLCASTING' },
  { label: 'Магия договора', value: 'PACT_MAGIC' },
  { label: 'Боевой стиль', value: 'FIGHTING_STYLE' },
  { label: 'Оружейные приёмы', value: 'WEAPON_MASTERY' },
];

/**
 * Классовые умения для строки «Классовое умение». Умение творить заклинания
 * сюда не попадает: у него своя строка без полей — иначе одно и то же
 * требование записывалось бы двумя способами.
 */
export const CLASS_FEATURE_ROW_OPTIONS: Array<SelectOption> =
  CLASS_FEATURE_REQUIREMENT_OPTIONS.filter(
    (option) => option.value !== 'SPELLCASTING',
  );

/** Подписи видов дара. */
export const FEAT_GRANT_KIND_LABELS: Record<FeatGrantRowKind, string> = {
  SKILL: 'Навык',
  SAVING_THROW: 'Спасбросок',
  TOOL: 'Инструмент',
  LANGUAGE: 'Язык',
  ARMOR: 'Доспехи',
  WEAPON_CATEGORY: 'Категория оружия',
  WEAPON: 'Оружие',
  // Названо оружием, а не приёмом: приём — свойство самого оружия («Подсечка» у
  // длинного меча), и выбирают именно оружие, приём которого получают. Так же
  // этот дар назван в системе D&D — «Оружие с приёмом»
  WEAPON_MASTERY: 'Оружие с приёмом',
  // А здесь выбирают САМ приём, без оружия: «Тактический мастер» воина подменяет
  // приём своего оружия на Толкание, Изнурение или Замедление
  MASTERY_PROPERTY: 'Оружейный приём',
  ABILITY: 'Характеристика',
  DAMAGE_TYPE: 'Тип урона',
  OPTION: 'Вариант',
  FEAT: 'Черта',
};

/** Виды дара в порядке показа. */
const FEAT_GRANT_KIND_ORDER: Array<FeatGrantRowKind> = [
  'SKILL',
  'SAVING_THROW',
  'TOOL',
  'LANGUAGE',
  'ARMOR',
  'WEAPON_CATEGORY',
  'WEAPON',
  'WEAPON_MASTERY',
  'MASTERY_PROPERTY',
  'ABILITY',
  'DAMAGE_TYPE',
  'FEAT',
  'OPTION',
];

/** Виды дара как варианты селекта «Что даёт». */
export const FEAT_GRANT_KIND_OPTIONS: Array<
  SelectOption & { value: FeatGrantRowKind }
> = FEAT_GRANT_KIND_ORDER.map((kind) => ({
  value: kind,
  label: FEAT_GRANT_KIND_LABELS[kind],
}));

/** Как раздаётся строка дара. */
export const FEAT_GRANT_MODE_OPTIONS: Array<
  SelectOption & { value: FeatGrantRowMode }
> = [
  { value: 'ALL', label: 'Выдать всё' },
  { value: 'CHOICE', label: 'Дать выбрать' },
];

/**
 * Что даёт сделанный выбор. Компетентность удваивает бонус мастерства, поэтому
 * это отдельный исход, а не «владение посильнее».
 */
export const FEAT_CHOICE_GRANT_OPTIONS: Array<SelectOption> = [
  { label: 'Владение', value: 'PROFICIENCY' },
  { label: 'Компетентность', value: 'EXPERTISE' },
];

/**
 * Подписи видов модификаторов листа — они же пункты меню «Добавить
 * модификатор». Порядок пунктов задаётся порядком ключей.
 */
export const FEAT_MODIFIER_LABELS: Record<FeatModifierRowKind, string> = {
  HIT_POINTS_FLAT: 'Максимум хитов, постоянно',
  HIT_POINTS_PER_ACQUISITION_LEVEL: 'Максимум хитов, за уровень при взятии',
  HIT_POINTS_PER_LEVEL_AFTER: 'Максимум хитов, за следующий уровень',
  SPEED_WALK: 'Скорость ходьбы, прибавка',
  SPEED_FLY: 'Скорость полёта',
  SPEED_CLIMB: 'Скорость лазания',
  SPEED_SWIM: 'Скорость плавания',
  ARMOR_CLASS: 'Класс доспеха, прибавка',
  INITIATIVE: 'Инициатива, прибавка',
  INITIATIVE_PROFICIENCY_BONUS: 'Инициатива: плюс бонус мастерства',
  DARKVISION: 'Тёмное зрение',
  BLINDSIGHT: 'Слепое зрение',
  TRUESIGHT: 'Истинное зрение',
  TREMORSENSE: 'Чувство вибрации',
  TELEPATHY: 'Телепатия',
  DAMAGE_DEFENSE: 'Защита от урона',
  CONDITION_IMMUNITY: 'Иммунитет к состоянию',
  CREATURE_TYPE: 'Новый тип существа',
};

/** Виды модификаторов в порядке меню «Добавить». */
const FEAT_MODIFIER_KIND_ORDER: Array<FeatModifierRowKind> = [
  'HIT_POINTS_FLAT',
  'HIT_POINTS_PER_ACQUISITION_LEVEL',
  'HIT_POINTS_PER_LEVEL_AFTER',
  'SPEED_WALK',
  'SPEED_FLY',
  'SPEED_CLIMB',
  'SPEED_SWIM',
  'ARMOR_CLASS',
  'INITIATIVE',
  'INITIATIVE_PROFICIENCY_BONUS',
  'DARKVISION',
  'BLINDSIGHT',
  'TRUESIGHT',
  'TREMORSENSE',
  'TELEPATHY',
  'DAMAGE_DEFENSE',
  'CONDITION_IMMUNITY',
  'CREATURE_TYPE',
];

/** Виды модификаторов как пункты меню «Добавить модификатор». */
export const FEAT_MODIFIER_KIND_OPTIONS: Array<
  SelectOption & { value: FeatModifierRowKind }
> = FEAT_MODIFIER_KIND_ORDER.map((kind) => ({
  value: kind,
  label: FEAT_MODIFIER_LABELS[kind],
}));

/**
 * Границы количества типов урона в одном выборе: меньше одного выбор
 * бессмыслен, а больше пяти не просит ни одна черта — «Дар устойчивости к
 * энергиям» просит два.
 */
export const FEAT_DAMAGE_CHOICE_COUNT = { min: 1, max: 5 };

/** Как задан тип урона у строки защиты. */
export const FEAT_MODIFIER_SOURCE_OPTIONS: Array<
  SelectOption & { value: FeatModifierRowSource }
> = [
  { value: 'FIXED', label: 'Фиксированный' },
  { value: 'CHOICE', label: 'На выбор игрока' },
];

/** Виды защиты от урона. */
export const FEAT_DAMAGE_DEFENSE_OPTIONS: Array<
  SelectOption & { value: FeatDamageDefenseKind }
> = [
  { value: 'RESISTANCE', label: 'Сопротивление' },
  { value: 'IMMUNITY', label: 'Иммунитет' },
  { value: 'VULNERABILITY', label: 'Уязвимость' },
];

/** Подписи видов требований. */
export const FEAT_PREREQUISITE_LABELS: Record<FeatPrerequisiteRowKind, string> =
  {
    ABILITY: 'Характеристика',
    LEVEL: 'Уровень персонажа',
    SPELLCASTING: 'Умение творить заклинания',
    CLASS_FEATURE: 'Классовое умение',
    ARMOR_PROFICIENCY: 'Владение доспехами',
    FEAT: 'Требуется черта',
    CLASS: 'Требуется класс',
    SPECIES: 'Требуется вид',
    BACKGROUND: 'Требуется предыстория',
    CAMPAIGN: 'Сеттинг кампании',
    ANY_DRAGONMARK: 'Любая метка дракона',
    TEXT: 'Произвольное требование',
  };

/** Виды требований в порядке меню «Добавить». */
const FEAT_PREREQUISITE_KIND_ORDER: Array<FeatPrerequisiteRowKind> = [
  'ABILITY',
  'LEVEL',
  'SPELLCASTING',
  'CLASS_FEATURE',
  'ARMOR_PROFICIENCY',
  'FEAT',
  'CLASS',
  'SPECIES',
  'BACKGROUND',
  'CAMPAIGN',
  'ANY_DRAGONMARK',
  'TEXT',
];

/** Виды требований как пункты меню «Добавить требование». */
export const FEAT_PREREQUISITE_KIND_OPTIONS: Array<
  SelectOption & { value: FeatPrerequisiteRowKind }
> = FEAT_PREREQUISITE_KIND_ORDER.map((kind) => ({
  value: kind,
  label: FEAT_PREREQUISITE_LABELS[kind],
}));

/**
 * Раздел справочника, из которого выбираются записи требования-ссылки. Ключи
 * требований и разделов справочника совпадают не везде, поэтому связь задана
 * картой, а не приведением строки.
 */
export const FEAT_PREREQUISITE_REF_KINDS: Partial<
  Record<FeatPrerequisiteRowKind, 'FEAT' | 'CLASS' | 'SPECIES' | 'BACKGROUND'>
> = {
  FEAT: 'FEAT',
  CLASS: 'CLASS',
  SPECIES: 'SPECIES',
  BACKGROUND: 'BACKGROUND',
};

/**
 * Варианты уровня для строки выбора заклинаний.
 *
 * Один селект вместо двух полей («уровень» и «не выше уровня»): в записи это
 * два поля фильтра, но автору они задают одно — какого уровня заклинание берут.
 * Значение склеено из вида ограничения и уровня, потому что селект хранит одну
 * строку.
 */
export const FEAT_SPELL_LEVEL_OPTIONS: Array<SelectOption> = [
  { value: FEAT_SPELL_ANY_LEVEL_VALUE, label: 'Любой уровень' },
  ...range(0, 10).map((level) => ({
    value: `${FEAT_SPELL_EXACT_LEVEL_PREFIX}${level}`,
    label: level ? `${level}-й уровень` : 'Заговор',
  })),
  ...range(1, 10).map((level) => ({
    value: `${FEAT_SPELL_UP_TO_LEVEL_PREFIX}${level}`,
    label: `Не выше ${level}-го уровня`,
  })),
];

/**
 * Значение селекта уровня по строке выбора.
 *
 * @param mode как задан уровень.
 * @param level уровень строки; у «любого» его нет.
 * @returns значение селекта.
 */
export function getFeatSpellLevelValue(
  mode: FeatSpellLevelMode,
  level: number | undefined,
): string {
  if (mode === 'ANY' || level === undefined) {
    return FEAT_SPELL_ANY_LEVEL_VALUE;
  }

  return mode === 'UP_TO'
    ? `${FEAT_SPELL_UP_TO_LEVEL_PREFIX}${level}`
    : `${FEAT_SPELL_EXACT_LEVEL_PREFIX}${level}`;
}

/**
 * Круг строки по значению селекта. Незнакомое значение читается как «любой
 * круг» — так же читается и пустой фильтр.
 *
 * @param value значение селекта.
 * @returns вид ограничения и круг.
 */
export function parseFeatSpellLevelValue(value: string): {
  mode: FeatSpellLevelMode;
  level: number | undefined;
} {
  const prefixes = [
    [FEAT_SPELL_EXACT_LEVEL_PREFIX, 'EXACT'],
    [FEAT_SPELL_UP_TO_LEVEL_PREFIX, 'UP_TO'],
  ] as const;

  for (const [prefix, mode] of prefixes) {
    if (value.startsWith(prefix)) {
      const level = Number.parseInt(value.slice(prefix.length), 10);

      if (!Number.isNaN(level)) {
        return { mode, level };
      }
    }
  }

  return { mode: 'ANY', level: undefined };
}

/**
 * Круг «по ячейкам»: граница берётся из ячеек заклинаний персонажа.
 *
 * Только у выдачи списка класса: игрок, выбирающий заклинание сам, видит круг в
 * списке и лишнего не возьмёт, а выдача сыплется на лист молча — и «все заклинания
 * друида» без границы дали бы девятый круг на первом уровне.
 */
const FEAT_SPELL_SLOTS_LEVEL_VALUE = 'SLOTS';

/**
 * Варианты уровня для группы «весь список класса».
 *
 * Те же, что у порции выбора, плюс «по ячейкам»: уровень такой группы не задан
 * числом, а растёт вместе с персонажем, и посчитать его может только лист.
 */
export const FEAT_GRANTED_SPELL_LEVEL_OPTIONS: Array<SelectOption> = [
  { value: FEAT_SPELL_ANY_LEVEL_VALUE, label: 'Любой уровень' },
  {
    value: FEAT_SPELL_SLOTS_LEVEL_VALUE,
    label: 'Не выше доступного уровня',
  },
  ...FEAT_SPELL_LEVEL_OPTIONS.filter(
    (option) => option.value !== FEAT_SPELL_ANY_LEVEL_VALUE,
  ),
];

/**
 * Значение селекта круга по группе выдачи.
 *
 * @param mode как задан круг.
 * @param level круг группы; у «любого» и «по ячейкам» его нет.
 * @returns значение селекта.
 */
export function getFeatGrantedSpellLevelValue(
  mode: FeatGrantedSpellLevelMode,
  level: number | undefined,
): string {
  return mode === 'SLOTS'
    ? FEAT_SPELL_SLOTS_LEVEL_VALUE
    : getFeatSpellLevelValue(mode, level);
}

/**
 * Круг группы выдачи по значению селекта.
 *
 * @param value значение селекта.
 * @returns вид ограничения и круг.
 */
export function parseFeatGrantedSpellLevelValue(value: string): {
  mode: FeatGrantedSpellLevelMode;
  level: number | undefined;
} {
  return value === FEAT_SPELL_SLOTS_LEVEL_VALUE
    ? { mode: 'SLOTS', level: undefined }
    : parseFeatSpellLevelValue(value);
}

/** Откуда группа выдачи берёт заклинания — пункты селекта строки. */
export const FEAT_GRANTED_SPELL_SOURCE_OPTIONS: Array<
  SelectOption & { value: FeatGrantedSpellSource }
> = [
  { value: 'LIST', label: 'Перечисленные' },
  { value: 'CLASS_LIST', label: 'Весь список класса' },
];

/** Наименьший уровень персонажа: с него начинается ступень роста. */
export const CLASS_LEVEL_MIN = 1;

/** Наибольший уровень персонажа: дальше таблица прогрессии не идёт. */
export const CLASS_LEVEL_MAX = 20;

/** Наименьшее количество в ступени роста выбора: ноль выбором не является. */
export const CHOICE_COUNT_MIN = 1;

/** Наибольшее количество в ступени роста выбора. */
export const CHOICE_COUNT_MAX = 20;

/**
 * Наибольшее количество заклинаний в одной порции выбора: больше десяти разом
 * не даёт ни одна запись, а поле с открытым верхом путало бы автора.
 */
export const SPELL_PICK_COUNT_MAX = 10;

/** Нижняя граница максимума ресурса: ноль — границы нет. */
export const COUNTER_MINIMUM_MIN = 0;

/** Наибольшая нижняя граница максимума: выше неё запас уже не «минимум». */
export const COUNTER_MINIMUM_MAX = 20;

/**
 * Подписи поля значений строки дара: они же объясняют, что именно выбирают.
 *
 * У «Оружия с приёмом» выбирают оружие: приём — свойство самого оружия, и
 * персонаж получает тот, что у выбранного оружия есть. У «Оружейного приёма»
 * выбирают сам приём — их восемь, и оружия у них нет.
 */
export const FEAT_GRANT_VALUE_PLACEHOLDERS = {
  weapons: 'Выбери оружие',
  tools: 'Выбери инструменты',
  masteryProperties: 'Выбери приёмы',
} as const;

/** Когда ресурс черты восстанавливается. */
export const FEAT_COUNTER_RECOVERY_OPTIONS: Array<SelectOption> = [
  { value: 'SHORT_REST', label: 'Короткий отдых' },
  { value: 'LONG_REST', label: 'Продолжительный отдых' },
  {
    value: 'SHORT_REST_ONE',
    label: 'Один заряд на коротком, все на продолжительном',
  },
];

/**
 * Подписи и пояснения редактора механики черты.
 *
 * Механику той же моделью хранят умение класса, вид и предыстория, и редакторы
 * строк у них общие. Подписи, в которых черта названа источником даров,
 * такие формы переопределяют своими ({@link FeatEditorLabelOverrides}) —
 * иначе в форме класса «одна строка — одно, что даёт черта» сбивало бы с
 * толку: в умении класса чертой ничего не даётся.
 */
export const FEAT_EDITOR_LABELS = {
  /** Разделитель между строками: они складываются, а не заменяют друг друга. */
  rowsAnd: 'И',

  /** Разделитель видов в заголовке строки дара. */
  kindSeparator: ' или ',

  addGrant: 'Добавить дар',
  grantsHint: 'Одна строка — одно, что черта даёт.',
  grantsHintDetails:
    'Например: «Крепыш» даёт владение спасбросками Телосложения — это строка '
    + '«Спасбросок → выдать всё → Телосложение». А «Умелый» даёт выбрать три '
    + 'штуки из навыков и инструментов — это строка «Навык + Инструмент → дать '
    + 'выбрать → 3». Нужно и то, и другое — заводите две строки.',
  grantsEmpty: 'Дары не заданы.',

  kind: 'Что даёт (можно несколько)',
  kindHint:
    'Можно отметить несколько видов сразу — тогда игрок выбирает из общей кучи. '
    + 'Так работает «Умелый»: три штуки вперемешку из навыков и инструментов. '
    + 'Оружие, оружие с приёмом, категорию оружия, черту и «вариант» смешивать '
    + 'нельзя — их значения берутся из каталога, и в общей куче их не различить, '
    + 'поэтому такой вид остаётся в строке один. «Оружие с приёмом» и '
    + '«Оружейный приём» — разные вещи: в первом выбирают ВИДЫ ОРУЖИЯ и '
    + 'получают тот приём, что у оружия есть, во втором — САМ ПРИЁМ из восьми.',
  kindSingleHint:
    'Отметьте второй вид — и игрок будет выбирать из общей кучи: так «Умелый» '
    + 'даёт навык ИЛИ инструмент одной строкой.',

  mode: 'Как даётся',
  modeHint:
    'Выдать всё — персонаж получает всё перечисленное сразу. Дать выбрать — '
    + 'при взятии черты игрок берёт из набора столько, сколько указано. Нужно и '
    + 'то, и другое — заведите две строки.',

  values: 'Что выдаётся',
  pool: 'Из чего выбирают',
  poolHint:
    'Пусто — выбирать можно любое значение отмеченных видов. Перечислите, '
    + 'чтобы сузить: «Отмеченный драконом» даёт на выбор только пять типов '
    + 'урона. У «Оружия с приёмом» перечисляют оружие: приём — свойство самого '
    + 'оружия, и персонаж получает тот, что у выбранного оружия есть. А у '
    + '«Оружейного приёма» перечисляют сами приёмы: так «Тактический мастер» '
    + 'даёт на выбор только Толкание, Изнурение и Замедление.',
  poolMixedHint:
    'У строки несколько видов, поэтому игрок выбирает из всех значений сразу. '
    + 'Сузить такой набор можно только перечислив значения руками.',
  poolCustomHint:
    'Справочника у этого вида нет — перечислите варианты сами: слева значение, '
    + 'которое уйдёт на лист, справа подпись для игрока.',

  optionValue: 'Значение',
  optionName: 'Подпись',
  optionAdd: 'Добавить вариант',
  narrowPool: 'Сузить набор',

  featCategories: 'Категории черт',
  featCategoriesPlaceholder: 'Любая категория',
  featCategoriesHint:
    'Из каких категорий игрок выбирает черту. «Боевой стиль» — и игроку '
    + 'предложат все черты этой категории, включая те, что допишут позже. '
    + 'Пусто — любая категория. Список ниже сужает пул до перечисленных черт.',
  featPoolHint:
    'Пусто — любая черта отмеченных категорий (или вообще любая, если категории '
    + 'не отмечены). Перечислите, чтобы дать выбрать только из этих черт.',
  featValuesHint:
    'Перечисленные черты персонаж получает сразу, без выбора, — как черту '
    + 'происхождения от предыстории.',

  label: 'Подпись для игрока',
  labelPlaceholder: 'Напр. «Выберите навык»',
  count: 'Сколько',
  countEqualsProficiencyBonus: 'Равно бонусу мастерства',
  countEqualsProficiencyBonusHint:
    'Сколько выбирают, растёт вместе с персонажем: на 1–4 уровнях два, дальше '
    + 'больше. Так устроен «Ритуальный заклинатель».',

  grants: 'Что даёт',
  onlyIfNotProficient: 'Только то, чем ещё не владеет',
  onlyIfProficient: 'Только то, чем уже владеет',
  expertiseIfProficient: 'Владеет — получает компетентность',
  rechooseOnLongRest: 'Пересматривается на продолжительном отдыхе',
  choiceRequiredLevel: 'С уровня',
  choiceRequiredLevelHint:
    'Уровень персонажа, с которого спрашивают этот выбор. Пусто — сразу. '
    + 'Нужен умению, которое спрашивает одно и то же дважды: компетентность '
    + 'плут получает на 1 уровне и ещё раз на 6 — это две строки, а не два '
    + 'умения.',

  abilityBonus: 'Повышение',
  abilityUpto: 'Предел',
  abilityHint:
    'Пусто — повышения нет. У выбора поднимается та характеристика, которую '
    + 'назвал игрок («Устойчивый»). Предел: 20 у обычных черт, 30 у эпических '
    + 'даров.',

  /** Вкладка «Автоматизация» */
  modifiersTitle: 'Модификаторы листа',
  modifiersHint: 'То, что черта меняет на листе навсегда.',
  modifiersHintDetails:
    'Например: «Крепкий» добавляет 2 хита за каждый уровень, «Бдительный» — '
    + 'бонус мастерства к инициативе, «Ловкач» — 10 футов к скорости. Если '
    + 'прибавка работает не всегда («+1 к КД, пока в доспехе»), её место не '
    + 'здесь, а на вкладке «Эффекты»: там у эффекта есть условие.',
  modifiersEmpty: 'Модификаторов нет.',
  addModifier: 'Добавить модификатор',
  modifierValue: 'Значение',
  equalsWalk: 'Равна скорости ходьбы',
  damageType: 'Тип урона',
  defenseKind: 'Вид защиты',
  damageTypeSource: 'Тип урона',
  damageTypeSourceHint:
    'Фиксированный — тип урона задан здесь и тот же у всех. На выбор игрока — '
    + 'тип называет игрок при взятии черты: «Закалённая кожа» даёт '
    + 'сопротивление дробящему ИЛИ рубящему, а не обоим сразу.',
  damageTypesPool: 'Из чего выбирать',
  damageTypesPoolHint:
    'Пусто — любой тип урона: «Отмеченный драконом» ограничен пятью типами, а '
    + '«Дар устойчивости к энергиям» — нет.',
  damageTypesPoolPlaceholder: 'Любой тип урона',
  damageChoiceCount: 'Сколько выбрать',
  damageChoiceLabel: 'Подпись выбора',
  damageChoiceLabelPlaceholder: 'Выберите тип урона',
  condition: 'Состояние',
  creatureType: 'Тип существа',

  /** Ресурсы черты */
  countersTitle: 'Ресурсы',
  countersHint: 'Запас, который тратится и восстанавливается на отдыхе.',
  countersHintDetails:
    'Например, «Удачливый» даёт очки удачи: их столько же, сколько бонус '
    + 'мастерства, и они возвращаются на продолжительном отдыхе. В поле '
    + '«Максимум» так и пишут: @prof — бонус мастерства, @level — уровень '
    + 'персонажа, можно и просто число, а ещё умножить: @level * 5. Если ряд '
    + 'формулой не пишется — 4 кости с 3 уровня, 5 с 7, 6 с 15, — заводят '
    + 'ступени: они старше формулы. «Минимум» подпирает формулу снизу: '
    + 'вдохновение барда равно модификатору Харизмы, но не меньше одного, и с '
    + 'Харизмой +0 бард всё равно вдохновляет один раз. «Указать в таблице» '
    + 'добавляет ресурс колонкой в таблицу прогрессии класса — ряд по уровням '
    + 'справочник соберёт сам, из ступеней или формулы; максимум по '
    + 'модификатору характеристики колонкой не показывается, у него нет '
    + 'одинакового ряда для всех.',
  countersEmpty: 'Ресурсов нет.',
  addCounter: 'Добавить ресурс',
  counterName: 'Название',
  counterNamePlaceholder: 'Очки удачи',
  counterShortName: 'Кратко',
  counterMax: 'Максимум',
  counterMin: 'Минимум',
  choiceScalingTitle: 'Рост по уровням',
  choiceScalingEmpty:
    'Ступеней нет — количество не растёт и берётся из поля «Сколько».',
  addChoiceScaling: 'Добавить ступень',
  choiceScalingLevel: 'С уровня',
  choiceScalingCount: 'Всего',
  choiceShowInTable: 'Указать в таблице',
  choiceShowInTableHint:
    'Количество станет колонкой таблицы прогрессии класса: ряд по уровням '
    + 'соберётся из ступеней — набирать его колонкой не нужно.',
  choiceShortName: 'Подпись колонки',
  choiceShortNameHint:
    'Что писать в шапке таблицы: «Приёмы» вместо вопроса игроку. Пусто — '
    + 'берётся подпись выбора.',
  counterShowInTable: 'Указать в таблице',
  counterShowInTableHint:
    'Ресурс станет колонкой таблицы прогрессии класса: ряд по уровням соберётся '
    + 'из ступеней или формулы — набирать его колонкой не нужно.',
  counterRecovery: 'Восстановление',
  counterScalingTitle: 'Ступени по уровням',
  counterScalingEmpty: 'Ступеней нет — максимум считается формулой.',
  addCounterScaling: 'Добавить ступень',
  counterScalingLevel: 'С уровня',
  counterScalingMax: 'Зарядов',

  /** Вкладка «Требования» */
  prerequisiteLegacyTitle: 'Условие строкой (устаревшее)',
  prerequisiteLegacyPlaceholder:
    'Напр. «Сила или Ловкость 13 и выше» — если требования выше ещё не разобраны',
  prerequisiteTextHint:
    'Требование строкой, как его набирали до разбора по полям. Карточка черты '
    + 'показывает его, только пока строки требований выше не заполнены: как '
    + 'только там появится хоть одно требование, условие на сайте соберётся из '
    + 'них, а это поле останется лежать про запас. Со временем оно уйдёт '
    + 'совсем — разобранную черту здесь можно очистить.',
  prerequisitesHint: 'Кому черта доступна.',
  prerequisitesHintDetails:
    'Все строки должны выполняться разом, а внутри строки достаточно одного '
    + 'значения: «Сила или Ловкость 13+» — это одна строка с двумя '
    + 'характеристиками. Строкой из книги остаётся поле «Предварительное '
    + 'условие» на вкладке «Основное»: здесь то же самое разобрано по полям, '
    + 'чтобы лист мог проверить сам.',
  prerequisitesEmpty: 'Требований нет — это черта происхождения.',
  addPrerequisite: 'Добавить требование',
  prerequisiteAbilities: 'Одна из',
  prerequisiteMinValue: 'Не ниже',
  prerequisiteLevel: 'Не ниже уровня',
  prerequisiteClassFeaturesPlaceholder: 'Умения…',
  prerequisiteCampaignPlaceholder: 'Напр. «Эберрон»',
  prerequisiteTextPlaceholder: 'Напр. «превращение в лича»',

  /** Вкладка «Заклинания» */
  grantedSpellsTitle: 'Заклинания без выбора',
  grantedSpellsHint:
    'Заклинания, которые черта даёт знать сразу: «Отмеченный драконом Ориена» '
    + 'даёт «Магическую руку». Уровень и школу лист берёт из справочника, '
    + 'поэтому здесь достаточно указать заклинание.',
  grantedSpellsEmpty: 'Черта не даёт знать заклинания без выбора.',
  addGrantedSpell: 'Добавить заклинание',
  grantedSpellLevel: 'С уровня',
  grantedSpellLevelPlaceholder: 'сразу',
  grantedSpellLevelHint:
    'Уровень ПЕРСОНАЖА, с которого приходит ЭТА группа. Пусто — сразу при '
    + 'взятии черты. У «Метки исцеления» «Лечение ран» есть с первого уровня, а '
    + '«Малое восстановление» — только с третьего: это две группы, а не одна. '
    + 'Не путать с уровнем заклинания: уровень показан бейджем и берётся из '
    + 'самой записи.',
  addGrantedSpellGroup: 'Добавить группу',
  removeGrantedSpellGroup: 'Удалить группу',
  grantedSpellGroupSource: 'Что выдаётся',
  grantedSpellGroupSourceHint:
    'Перечисленные — вот эти заклинания и никакие другие. Весь список класса — '
    + 'всё, что доступно классу в справочнике: список собирается при выдаче, '
    + 'поэтому новое заклинание класса достанется новым персонажам само, без '
    + 'правки записи.',
  grantedSpellGroupClasses: 'Списки классов',
  grantedSpellGroupClassesHint:
    'Чьи списки заклинаний выдаются. Несколько классов складываются: это не '
    + 'выбор игрока, а объединение списков.',
  grantedSpellGroupLevel: 'Уровень заклинания',
  grantedSpellGroupLevelHint:
    'Какого уровня заклинания брать из списка. «Не выше доступного уровня» — '
    + 'граница берётся из ячеек персонажа и растёт вместе с ним: друид знает '
    + 'свой список ровно до того уровня, который способен наложить. Без '
    + 'ограничения персонаж получит и заклинания 9 уровня на первом уровне.',
  grantedSpellGroupLevelFromRecord: 'из записи',
  grantedSpellGroupFromLevelPrefix: 'с',
  grantedSpellGroupFromLevelSuffix: 'уровня',
  grantedSpellGroupFromStart: 'сразу',
  grantedSpellGroupTitleSeparator: ' — ',
  grantedSpellGroupClassListTitle: 'Весь список класса',
  grantedSpellGroupListTitle: 'Перечисленные',
  grantedSpellGroupAbility: 'Характеристика',
  grantedSpellGroupAbilityHint:
    'От какой характеристики считаются Сл и атака ЭТИХ заклинаний. Пусто — от '
    + 'класса, чья это магия. У группы, а не у записи целиком: один набор '
    + 'заклинаний может считаться от одной характеристики, другой — от другой.',
  grantedSpellGroupAbilityPlaceholder: 'От класса',

  spellListTitle: 'Заклинания списка',
  spellListHint:
    'Заклинания, которые черта добавляет в список класса персонажа, — таблица '
    + '«Заклинания метки».',
  spellListLevel: 'С уровня',
  spellListLevelPlaceholder: 'сразу',
  spellListLevelHint:
    'Уровень персонажа, с которого открывается ЭТОТ список. Пусто — сразу при '
    + 'взятии черты. Одна пачка приходит с первого уровня, следующая с пятого — '
    + 'это два списка, а не один: иначе персонаж получил бы всю таблицу сразу.',
  addSpellList: 'Добавить список',
  spellListFromLevelPrefix: 'с',
  spellListFromLevelSuffix: 'уровня',
  spellListFromStart: 'сразу',
  spellListHintDetails:
    'Это НЕ выдача и НЕ выбор. Выданное заклинание персонаж знает и накладывает '
    + 'сразу; заклинание отсюда он лишь может выучить или подготовить, как любое '
    + 'из списка своего класса, — на листе оно появится в окне добавления '
    + 'заклинаний рядом с классовыми. Если свалить их в одну кучу, «Метка '
    + 'исцеления» выдаст всю таблицу готовыми заклинаниями. Каждый список '
    + 'открывается на своём уровне и складывается с предыдущими. «Выберите N из '
    + 'этих заклинаний» — не сюда, а в выбор заклинаний с перечисленным пулом. '
    + 'Круг указывать не надо: он берётся из самой записи и показан бейджем.',
  spellListEmpty: 'Черта не расширяет список заклинаний.',
  spellListRequiresSpellcasting:
    'Нужно умение «Использование заклинаний» или «Магия договора»',
  spellListRequiresSpellcastingHint:
    'Так написано у всех черт метки дракона: без своего заклинательства '
    + 'расширять нечего. Выключено — список расширяется всегда.',
  alwaysPrepared: 'Подготавливать не нужно',
  alwaysPreparedHint:
    'По умолчанию выданное заклинание ложится в книгу наравне с остальными и '
    + 'занимает подготовку. Отметка у группы: заклинания домена всегда '
    + 'подготовлены, а выданное тем же умением сверх них подготовку занимает.',

  spellChoicesTitle: 'Выбор заклинаний',
  spellChoicesHint: 'Заклинания, которые игрок выбирает сам при взятии черты.',
  spellChoicesHintDetails:
    'Так устроен «Посвящённый в магию»: из списка одного класса игрок берёт '
    + 'два заговора и одно заклинание первого уровня. Список классов один на '
    + 'все строки: если классов несколько, лист персонажа сперва спросит класс, '
    + 'а потом даст выбрать из его списка все строки сразу. Строка может вместо '
    + 'уровня и списков классов перечислять конкретные заклинания — тогда игрок '
    + 'выбирает только из них. Выбранное ложится в книгу так же, как выданное '
    + 'чертой без выбора.',
  addSpellChoice: 'Добавить заклинания',
  removeSpellChoice: 'Убрать строку выбора',
  spellChoiceClasses: 'Списки классов',
  spellChoiceClassesHint:
    'Из чьих списков заклинаний игрок выбирает. Несколько классов — игрок '
    + 'выберет один из них, и все строки ниже соберутся из его списка: по '
    + 'правилам список один, а не объединение перечисленных. Пусто — выбор из '
    + 'всех заклинаний справочника. Поле относится только к строкам с поиском '
    + 'по уровню: у строк с перечисленными заклинаниями класс берётся из самой '
    + 'записи, и списки классов им не нужны.',
  spellChoiceLevel: 'Уровень заклинания',
  spellChoiceCount: 'Сколько',
  spellChoiceLabel: 'Подпись для игрока',
  spellChoiceLabelPlaceholder: 'Например: Выберите два заговора',
  spellChoiceSource: 'Откуда выбирают',
  spellChoiceSourceHint:
    '«По уровню и спискам классов» — пул собирается поиском по справочнику: '
    + 'все заклинания названного уровня из списков выбранных классов, и сам '
    + 'пополняется с каталогом. «Из перечисленных заклинаний» — игрок выбирает '
    + 'ровно из тех записей, что добавлены ниже; уровень и класс у них свои.',
  spellChoiceSourceFilter: 'По уровню и спискам классов',
  spellChoiceSourceList: 'Из перечисленных заклинаний',
  spellChoiceLevelFromRecord: 'по записям',
  spellChoiceListSpells: 'Заклинания, из которых выбирают',

  spellcastingAbilityTitle: 'Характеристика заклинаний на выбор',
  spellcastingAbility: 'Из каких характеристик',
  spellcastingAbilityHint:
    'От неё считаются модификатор атаки и Сл спасброска заклинаний, которые '
    + 'игрок ВЫБИРАЕТ. Пусто — лист возьмёт характеристику того класса, чья это '
    + 'магия. Одна — она и будет; несколько — лист даст игроку выбрать одну из '
    + 'них («Посвящённый в магию»). У выданных заклинаний характеристика своя у '
    + 'каждой группы выдачи — там один набор может считаться от одной '
    + 'характеристики, другой от другой.',
  spellcastingAbilityPlaceholder: 'От класса',
};

/** Подписи редактора механики: ключи те же, что у {@link FEAT_EDITOR_LABELS}. */
export type FeatEditorLabels = typeof FEAT_EDITOR_LABELS;

/**
 * Переопределение подписей редактора механики формой другого раздела.
 *
 * Редакторы строк общие для черты, умения класса, вида и предыстории, а
 * подписи в них называют чертой источник даров. Форма, где источник — умение
 * класса, передаёт свои формулировки только для тех ключей, где это важно;
 * остальные остаются от черты.
 */
export type FeatEditorLabelOverrides = Partial<FeatEditorLabels>;

/**
 * Подписи редактора механики с поправками формы-владельца.
 *
 * @param overrides подписи, которые форма переопределяет; пусто — подписи черты.
 * @returns полный набор подписей.
 */
export function getFeatEditorLabels(
  overrides: FeatEditorLabelOverrides = {},
): FeatEditorLabels {
  return { ...FEAT_EDITOR_LABELS, ...overrides };
}

/** Откуда строка выбора заклинаний берёт пул — варианты селекта. */
export const FEAT_SPELL_PICK_SOURCE_OPTIONS: Array<
  SelectOption & { value: FeatSpellPickSource }
> = [
  { value: 'FILTER', label: FEAT_EDITOR_LABELS.spellChoiceSourceFilter },
  { value: 'LIST', label: FEAT_EDITOR_LABELS.spellChoiceSourceList },
];

/** Подпись заговора: уровня у него нет. */
const FEAT_CANTRIP_LABEL = 'Заговор';

/** Окончание после номера уровня. */
const FEAT_SPELL_LEVEL_SUFFIX = '-й уровень';

/**
 * Уровень заклинания короткой подписью.
 *
 * @param level уровень заклинания; 0 — заговор.
 * @returns подпись уровня.
 */
export function getFeatSpellLevelLabel(level: number): string {
  return level === 0
    ? FEAT_CANTRIP_LABEL
    : `${level}${FEAT_SPELL_LEVEL_SUFFIX}`;
}

/** Подписи строк со ссылками на записи справочника. */
export const FEAT_REF_ROWS_LABELS = {
  missing: 'Не найдена',
  missingHint:
    'Записи с такой ссылкой в справочнике нет. Требование останется в '
    + 'описании, но лист сверить его не сможет.',
  openEntry: 'Открыть карточку в новой вкладке',
  add: 'Добавить',
} as const;
