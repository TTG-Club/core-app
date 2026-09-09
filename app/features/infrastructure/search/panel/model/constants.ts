/**
 * Подсказка в строке поиска целиком — уходит в `aria-label` кнопки. Видимая
 * строка собирается по частям и меняется, поэтому скринридерам нужна отдельная
 * неподвижная формулировка.
 */
export const SEARCH_PANEL_PLACEHOLDER =
  'Поиск по заклинаниям, существам, предметам и правилам';

/** Неизменное начало видимой подсказки — дальше подставляется раздел */
export const SEARCH_PANEL_HINT_PREFIX = 'Поиск по';

/** Разделы, которые по кругу подставляются после «Поиск по» */
export const SEARCH_PANEL_HINT_WORDS: Array<string> = [
  'заклинаниям',
  'существам',
  'магическим предметам',
  'классам',
  'снаряжению',
  'видам',
  'предысториям',
  'чертам',
  'правилам',
  'статьям',
];

/** Сколько букв раздела влезает в строку поиска на самом узком телефоне */
const HINT_WORD_MOBILE_LIMIT = 13;

/**
 * Разделы для телефона: строка поиска там вдвое уже, и длинные названия
 * упираются в край поля. Список выводится из общего, чтобы новый раздел не
 * пришлось добавлять дважды.
 */
export const SEARCH_PANEL_HINT_WORDS_COMPACT: Array<string> =
  SEARCH_PANEL_HINT_WORDS.filter(
    (word) => word.length <= HINT_WORD_MOBILE_LIMIT,
  );

/** Сколько набранный раздел держится на экране до стирания, мс */
export const SEARCH_PANEL_HINT_HOLD = 2200;

/** Шаг стирания одной буквы, мс — назад машинка идёт быстрее, чем печатает */
export const SEARCH_PANEL_HINT_ERASE_STEP = 38;

/** Пауза с пустой строкой между стиранием и набором, мс */
export const SEARCH_PANEL_HINT_SWITCH_PAUSE = 280;

/** Шаг набора одной буквы, мс */
export const SEARCH_PANEL_HINT_TYPE_STEP = 72;

/** Горячая клавиша открытия палитры поиска (см. `defineShortcuts` в SidebarPanel) */
export const SEARCH_PANEL_SHORTCUT = '\\';
