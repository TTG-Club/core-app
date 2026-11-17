import type { AbilityKey } from '../types';

import { rgb } from 'pdf-lib';

import { PDF_CONTENT_BOTTOM, PDF_PAGE_WIDTH } from './constants';

/**
 * Раскладка листа PHB: двухстраничный лист по образцу листа персонажа из Книги
 * игрока 2024. Геометрия задана в пунктах A4, координаты — от верха страницы.
 */

/** Поля страницы листа PHB: уже, чем у листа TTG, — рамки идут почти до края. */
export const PHB_MARGIN = 18;

/** Ширина содержимого листа PHB. */
export const PHB_CONTENT_WIDTH = PDF_PAGE_WIDTH - PHB_MARGIN * 2;

/** Правая граница содержимого. */
export const PHB_RIGHT = PHB_MARGIN + PHB_CONTENT_WIDTH;

/** Нижняя граница рамок: ниже — колонтитул, общий с листом TTG. */
export const PHB_BOTTOM = PDF_CONTENT_BOTTOM;

/** Зазор между рамками. */
export const PHB_GAP = 5;

/** Срез углов рамки — фирменная «скошенная» рамка листа. */
export const PHB_CHAMFER = 5;

/** Внутренний отступ рамки. */
export const PHB_PADDING = 5;

/** Высота строки списка (навык, оружие, заклинание). */
export const PHB_ROW_HEIGHT = 11;

/** Высота строки таблицы оружия и заклинаний. */
export const PHB_TABLE_ROW_HEIGHT = 13;

/** Половина диагонали ромбика отметки. */
export const PHB_DIAMOND_SIZE = 3;

/** Цвета листа PHB: монохром, как у печатного листа. */
export const PHB_COLORS = {
  /** Основной текст и значения. */
  ink: rgb(0.1, 0.1, 0.12),

  /** Подписи полей. */
  label: rgb(0.38, 0.38, 0.42),

  /** Рамки. */
  frame: rgb(0.32, 0.32, 0.36),

  /** Линии под запись. */
  line: rgb(0.62, 0.62, 0.66),

  /** Заливка рамок. */
  fill: rgb(0.975, 0.975, 0.98),

  /** Заливка полей значений внутри рамок. */
  field: rgb(1, 1, 1),
};

/** Кегли листа PHB. */
export const PHB_FONT_SIZES = {
  /** Заголовок рамки. */
  title: 8,

  /** Подпись под полем. */
  label: 5.5,

  /** Значение в строке. */
  value: 7.5,

  /** Мелкий текст описаний умений. */
  body: 6.3,

  /** Имя персонажа. */
  name: 13,

  /** Крупное значение (КД, модификатор). */
  big: 15,

  /** Среднее значение (плитки, хиты). */
  medium: 11,
};

/**
 * Высота цифр относительно кегля (PT Sans): по ней числа центрируются в круге
 * и поле по видимым глифам, а не по высоте строки с выносными элементами.
 */
export const PHB_DIGIT_HEIGHT_RATIO = 0.7;

/** Высота шапки первой страницы. */
export const PHB_HEADER_HEIGHT = 82;

/** Ширины рамок шапки первой страницы слева направо. */
export const PHB_HEADER_WIDTHS = {
  name: 210,
  level: 58,
  armorClass: 56,
  hitPoints: 106,
  hitDice: 46,
};

/** Высота полосы-заголовка листа под шапкой. */
export const PHB_BANNER_HEIGHT = 14;

/** Ширина одной колонки характеристик. */
export const PHB_ABILITY_COLUMN_WIDTH = 110;

/** Высота верхней части блока характеристики: заголовок, модификатор, значение. */
export const PHB_ABILITY_HEAD_HEIGHT = 56;

/** Радиус круга модификатора характеристики. */
export const PHB_MODIFIER_RADIUS = 14;

/** Высота рамки бонуса мастерства. */
export const PHB_PROFICIENCY_BOX_HEIGHT = 40;

/** Высота рамки героического вдохновения. */
export const PHB_INSPIRATION_BOX_HEIGHT = 40;

/**
 * Характеристики по колонкам первой страницы: физические слева под бонусом
 * мастерства, ментальные справа — как на печатном листе.
 */
export const PHB_ABILITY_COLUMNS: AbilityKey[][] = [
  ['strength', 'dexterity', 'constitution'],
  ['intelligence', 'wisdom', 'charisma'],
];

/** Высота плитки верхнего ряда правой части (инициатива, скорость…). */
export const PHB_TILE_HEIGHT = 44;

/** Минимум строк таблицы оружия (пустые — под запись от руки). */
export const PHB_WEAPON_ROWS = 6;

/** Доли ширины столбцов таблицы оружия. */
export const PHB_WEAPON_COLUMN_RATIOS = [0.32, 0.17, 0.27, 0.24];

/** Высота нижнего ряда рамок «Умения вида» и «Черты». */
export const PHB_BOTTOM_BOX_HEIGHT = 150;

/** Сколько строк описания умения печатать до обрезки многоточием. */
export const PHB_FEATURE_MAX_LINES = 5;

/** Ширина левой части второй страницы: заклинательство и таблица заклинаний. */
export const PHB_SPELL_AREA_WIDTH = 414;

/** Высота верхнего ряда второй страницы. */
export const PHB_SPELL_TOP_HEIGHT = 100;

/** Ширина рамки заклинательной характеристики. */
export const PHB_SPELLCASTING_BOX_WIDTH = 140;

/** Сторона QR-кода на второй странице. */
export const PHB_QR_SIZE = 64;

/** Кругов в сетке ячеек заклинаний. */
export const PHB_SPELL_SLOT_LEVELS = 9;

/** Строк в сетке ячеек заклинаний (столбцов — по кругам, делённым на строки). */
export const PHB_SPELL_SLOT_GRID_ROWS = 3;

/**
 * Доли ширины столбцов таблицы заклинаний: круг, название, время, дистанция,
 * концентрация/ритуал/материалы и примечания.
 */
export const PHB_SPELL_COLUMN_RATIOS = [0.06, 0.33, 0.15, 0.15, 0.11, 0.2];

/** Высоты рамок правой колонки второй страницы. */
export const PHB_SIDE_HEIGHTS = {
  appearance: 116,
  biography: 172,
  languages: 62,
  coins: 54,
};

/** Сколько строк настройки на магические предметы рисовать минимум. */
export const PHB_ATTUNEMENT_ROWS = 3;

/** Заголовки рамок листа PHB. */
export const PHB_TITLES = {
  banner: 'Лист персонажа',
  hitPoints: 'Хиты',
  hitDice: ['Кости', 'хитов'],
  deathSaves: ['Спасброски', 'от смерти'],
  armorClass: ['Класс', 'доспеха'],
  proficiencyBonus: 'Бонус мастерства',
  inspiration: 'Героическое вдохновение',
  equipmentTraining: 'Владение снаряжением',
  initiative: 'Инициатива',
  speed: 'Скорость',
  size: 'Размер',
  passivePerception: 'Пассивная внимательность',
  weapons: 'Оружие и заговоры с уроном',
  classFeatures: 'Умения класса',
  speciesTraits: 'Умения вида',
  feats: 'Черты',
  spellcastingAbility: 'Заклинательная характеристика',
  spellSlots: 'Ячейки заклинаний',
  spells: 'Заговоры и подготовленные заклинания',
  appearance: 'Внешность',
  biography: 'Биография и характер',
  languages: 'Языки',
  equipment: 'Снаряжение',
  coins: 'Монеты',
};

/** Подписи полей листа PHB. */
export const PHB_LABELS = {
  name: 'Имя персонажа',
  background: 'Предыстория',
  className: 'Класс',
  species: 'Вид',
  subclass: 'Подкласс',
  level: 'Уровень',
  experience: 'Опыт',
  shield: 'Щит',
  currentHits: 'Текущие',
  temporaryHits: 'Временные',
  maxHits: 'Максимальные',
  spentHitDice: 'Потрачено',
  maxHitDice: 'Максимально',
  successes: 'Успехи',
  failures: 'Провалы',
  modifier: 'Модификатор',
  score: 'Значение',
  savingThrow: 'Спасбросок',
  armor: 'Доспехи',
  weapons: 'Оружие',
  masteries: 'Мастерство',
  tools: 'Инструменты',
  abilityModifier: 'Модификатор характеристики',
  spellSaveDc: 'Сложность спасброска',
  spellAttack: 'Бонус атаки заклинанием',
  slotsTotal: 'Всего',
  slotsSpent: 'Потрачено',
  slotLevel: 'ур.',
  pactSlot: 'договор',
  alignment: 'Мировоззрение',
  attunement: 'Настройка на магические предметы',
  moreFeatures: '… и ещё',
  referenceHint: 'полностью — в справочнике',
};

/**
 * Подписи флажков групп доспехов в рамке владения снаряжением — по ключу
 * группы каталога владений (`ARMOR_PROFICIENCY_GROUPS`).
 */
export const PHB_ARMOR_TRAINING_LABELS: Record<string, string> = {
  light: 'Лёгкие',
  medium: 'Средние',
  heavy: 'Тяжёлые',
  shields: 'Щиты',
};

/** Подписи столбцов таблицы оружия. */
export const PHB_WEAPON_COLUMNS = [
  'Название',
  'Бонус атаки / Сл',
  'Урон и тип урона',
  'Примечания',
];

/** Подписи столбцов таблицы заклинаний. */
export const PHB_SPELL_COLUMNS = [
  'Ур.',
  'Название',
  'Время накладывания',
  'Дистанция',
  'К  Р  М',
  'Примечания',
];

/** Буквы признаков заклинания: концентрация, ритуал, материальный компонент. */
export const PHB_SPELL_FLAGS = ['К', 'Р', 'М'];

/** Буква материального компонента в строке компонентов заклинания. */
export const PHB_MATERIAL_COMPONENT = 'М';

/** Подписи свойств оружия в примечаниях. */
export const PHB_WEAPON_NOTES = {
  ranged: 'дальнобойное',
  finesse: 'фехтовальное',
  heavy: 'тяжёлое',
  versatile: 'универсальное',
};

/** Минимум строк таблицы заклинаний на странице продолжения. */
export const PHB_SPELL_CONTINUED_SUFFIX = ' (продолжение)';
