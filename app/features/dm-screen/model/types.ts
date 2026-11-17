import type { ScreenPickerPlacement } from './schemas';

/**
 * Точка в px: на бесконечном поле ширмы (место окон) либо на холсте — его
 * видимой части, от её левого верхнего угла.
 */
export interface ScreenPoint {
  x: number;
  y: number;
}

/** Размер окна или холста, px. */
export interface ScreenSize {
  width: number;
  height: number;
}

/** Прямоугольник на холсте, px. */
export interface ScreenRect extends ScreenPoint, ScreenSize {}

/** Прямоугольник окна вместе с его идентификатором. */
export interface ScreenTile extends ScreenRect {
  id: string;
}

/** Направление по одной оси: `-1` — к началу, `1` — к концу, `0` — нет. */
export type ScreenDirection = -1 | 0 | 1;

/** За какие стороны окна тянут, меняя его размер. */
export interface ScreenResizeEdges {
  horizontal: ScreenDirection;
  vertical: ScreenDirection;
}

/** Ручка растягивания окна: сторона или угол. */
export interface ScreenResizeHandle {
  key: string;
  edges: ScreenResizeEdges;
  /** Классы места, размера и курсора ручки. */
  class: string;
}

/** Место в раскладке: доли холста от 0 до 1. */
export interface ScreenLayoutZone {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Раскладка окон: на какие места делится холст. */
export interface ScreenLayout {
  key: string;
  zones: ReadonlyArray<ScreenLayoutZone>;
}

/** Место раскладки, которое займёт окно, если его отпустить. */
export interface ScreenLayoutTarget {
  layout: ScreenLayout;
  zoneIndex: number;
}

/** Общая граница соседних окон: за неё тянут, меняя оба размера разом. */
export interface ScreenSplitter {
  key: string;
  /** Граница вертикальная: окна стоят слева и справа от неё. */
  isVertical: boolean;
  /** Где начинается промежуток между окнами вдоль оси движения, px. */
  position: number;
  /** Начало границы поперёк оси движения, px. */
  from: number;
  /** Конец границы поперёк оси движения, px. */
  to: number;
  /** Окна перед границей: слева или сверху. */
  beforeIds: ReadonlyArray<string>;
  /** Окна за границей: справа или снизу. */
  afterIds: ReadonlyArray<string>;
}

/**
 * Лист персонажа на ширме: свой открывается по идентификатору, чужой — по
 * токену ссылки, которой владелец поделился.
 */
export interface ScreenSheetLocation {
  source: 'own' | 'shared';
  /** Идентификатор своего листа или токен ссылки чужого. */
  key: string;
}

/** Лист персонажа в списке «Персонаж»: его можно поставить на ширму. */
export interface ScreenSheetOption {
  /** Путь окна: адрес страницы листа на сайте. */
  path: string;
  source: ScreenSheetLocation['source'];
  name: string;
  /** Классы с уровнями и вид. */
  subtitle: string;
  /** Портрет персонажа; без него — значок. */
  avatarUrl?: string;
}

/** Число на карточке листа: КД, инициатива, скорость и подобные. */
export interface ScreenSheetStat {
  key: string;
  label: string;
  icon: string;
  value: string;
}

/** Характеристика на карточке листа: значение, модификатор и спасбросок. */
export interface ScreenSheetAbility {
  key: string;
  /** Сокращённое название: «Сил», «Лов». */
  label: string;
  score: number;
  modifier: string;
  savingThrow: string;
  isSavingThrowProficient: boolean;
}

/** Навык на карточке листа. */
export interface ScreenSheetSkill {
  name: string;
  modifier: string;
  /** Персонаж владеет навыком хотя бы наполовину. */
  isProficient: boolean;
}

/** Карточка листа персонажа в окне ширмы. */
export interface ScreenSheetCard {
  name: string;
  subtitle: string;
  /** Портрет персонажа; без него — значок. */
  avatarUrl?: string;
  /** Текущие хиты и максимум: «31 / 44». */
  hitPoints: string;
  /** Временные хиты подписью; без них — ничего. */
  temporaryHitPoints?: string;
  /** Уровень истощения подписью; без истощения — ничего. */
  exhaustion?: string;
  stats: Array<ScreenSheetStat>;
  abilities: Array<ScreenSheetAbility>;
  skills: Array<ScreenSheetSkill>;
}

/** Просьба положить на ширму запись сайта или заметку. */
export interface ScreenWindowRequest {
  /** Адрес записи на сайте (`/spells/fireball`) или путь заметки. */
  path: string;
  /** Название в шапке окна. */
  title: string;
  /** Точка на холсте, рядом с которой встаёт окно; без неё — по центру. */
  origin?: ScreenPoint;
}

/** Раздел сайта, чьи записи открываются в окнах ширмы. */
export interface ScreenSection {
  /** Первый сегмент адреса записей раздела: `spells` у `/spells/fireball`. */
  path: string;
  /** Название раздела: подпись записи в поиске ширмы. */
  label: string;
  /** Откуда грузится запись; к адресу добавляется её `url`. */
  apiPath: string;
  /** Начало ключа кеша записи — то же, что у дровера раздела. */
  cacheKey: string;
  /** Иконка раздела, как в меню сайта. */
  icon: string;
  /** Имя пропа, в котором карточка раздела принимает запись. */
  bodyProp: string;
}

/**
 * Чем кончилась просьба положить запись на ширму: появилось новое окно,
 * запись уже была на ширме или окон слишком много.
 */
export type ScreenAddOutcome = 'added' | 'existing' | 'rejected';

/** Найденная поиском запись, которую ширма умеет показать. */
export interface ScreenSearchEntry {
  /** Адрес записи на сайте. */
  path: string;
  name: string;
  englishName?: string;
  sectionLabel: string;
  icon: string;
}

/** Запись сайта, разобранная по адресу: её раздел и `url` в нём. */
export interface ScreenEntryLocation {
  section: ScreenSection;
  url: string;
}

/** Вариант настройки панели раскладок в меню ширмы. */
export interface ScreenPickerOption {
  /** Где панель показывается при этом выборе. */
  placement: ScreenPickerPlacement;
  label: string;
  icon: string;
}
