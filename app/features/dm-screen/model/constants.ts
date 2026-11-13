import type { ScreenPickerPlacement } from './schemas';
import type {
  ScreenLayout,
  ScreenLayoutZone,
  ScreenPickerOption,
  ScreenResizeHandle,
  ScreenSection,
} from './types';

/** Страница ширмы. */
export const DM_SCREEN_ROUTE = '/tools/dm-screen';

export const DM_SCREEN_TITLE = 'Ширма Мастера';

/** Иконка ширмы в меню, на главной и на кнопке «В ширму». */
export const DM_SCREEN_ICON = 'tabler:layout-board-split';

/** Ширма пользователя на сервере. */
export const DM_SCREEN_API_PATH = '/api/v2/tools/dm-screen';

/** Ключ окон гостевой ширмы в localStorage. */
export const DM_SCREEN_STORAGE_KEY = 'dm-screen:windows';

/** Пауза перед сохранением ширмы на сервер после изменения окон, мс. */
export const DM_SCREEN_SAVE_DELAY = 800;

/** Сколько окон помещается на ширму: столько же принимает сервер. */
export const DM_SCREEN_WINDOW_LIMIT = 100;

/**
 * Разделы, чьи записи открываются в окнах ширмы. Ключ кеша и адрес API —
 * те же, что у дровера раздела: открытая в дровере запись повторно не
 * грузится.
 */
export const DM_SCREEN_SECTIONS: ReadonlyArray<ScreenSection> = [
  {
    path: 'spells',
    label: 'Заклинания',
    apiPath: '/api/v2/spells',
    cacheKey: 'spell',
    icon: 'tabler:sparkles',
    bodyProp: 'spell',
  },
  {
    path: 'bestiary',
    label: 'Бестиарий',
    apiPath: '/api/v2/bestiary',
    cacheKey: 'creature',
    icon: 'tabler:paw',
    bodyProp: 'creature',
  },
  {
    path: 'glossary',
    label: 'Глоссарий',
    apiPath: '/api/v2/glossary',
    cacheKey: 'glossary',
    icon: 'tabler:book-2',
    bodyProp: 'glossary',
  },
  {
    path: 'magic-items',
    label: 'Магические предметы',
    apiPath: '/api/v2/magic-items',
    cacheKey: 'magic-items',
    icon: 'tabler:wand',
    bodyProp: 'magicItem',
  },
  {
    path: 'items',
    label: 'Предметы',
    apiPath: '/api/v2/items',
    cacheKey: 'items',
    icon: 'tabler:backpack',
    bodyProp: 'item',
  },
  {
    path: 'feats',
    label: 'Черты',
    apiPath: '/api/v2/feats',
    cacheKey: 'feat',
    icon: 'tabler:star',
    bodyProp: 'feat',
  },
  {
    path: 'backgrounds',
    label: 'Предыстории',
    apiPath: '/api/v2/backgrounds',
    cacheKey: 'background',
    icon: 'tabler:writing',
    bodyProp: 'background',
  },
  {
    path: 'species',
    label: 'Виды',
    apiPath: '/api/v2/species',
    cacheKey: 'species',
    icon: 'tabler:users',
    bodyProp: 'species',
  },
  {
    path: 'classes',
    label: 'Классы',
    apiPath: '/api/v2/classes',
    cacheKey: 'classes',
    icon: 'tabler:sword',
    bodyProp: 'detail',
  },
];

/** Раздел классов: его карточка умеет переходить к подклассам на месте. */
export const DM_SCREEN_CLASSES_PATH = 'classes';

/** Начало пути окна-заметки: страницы на сайте у заметки нет. */
export const DM_SCREEN_NOTE_PREFIX = 'note:';

/** Сколько символов хранимой разметки помещается в заметку. */
export const DM_SCREEN_NOTE_MAX_LENGTH = 20000;

/** Длина названия окна: столько же принимает сервер. */
export const DM_SCREEN_TITLE_MAX_LENGTH = 256;

/** Пауза перед записью заметки, пока её набирают, мс. */
export const DM_SCREEN_NOTE_SAVE_DELAY = 400;

/** Размер нового окна, px. */
export const DM_SCREEN_WINDOW_SIZE = { width: 480, height: 600 } as const;

/** Меньше этого окно не сжимается, px: видны шапка и начало записи. */
export const DM_SCREEN_WINDOW_MIN_SIZE = { width: 260, height: 140 } as const;

/** Отступ окон от краёв холста, px. */
export const DM_SCREEN_MARGIN = 8;

/** Промежуток между соседними окнами, px. */
export const DM_SCREEN_GAP = 12;

/** С какого расстояния край окна притягивается к соседнему краю, px. */
export const DM_SCREEN_MAGNET_DISTANCE = 12;

/** Сдвиг нового окна от точки клика, px. */
export const DM_SCREEN_CLICK_OFFSET = 16;

/** Сдвиг каждого следующего окна, открытого без точки клика, px. */
export const DM_SCREEN_CASCADE_STEP = 32;

/** Сколько окон встаёт лесенкой, прежде чем она начнётся заново. */
export const DM_SCREEN_CASCADE_LENGTH = 8;

/**
 * Сколько окна остаётся на холсте по ширине, когда его утащили за край,
 * px: за эту часть окно вытягивают обратно.
 */
export const DM_SCREEN_REACHABLE_PART = 96;

/** Высота шапки окна, px: шапка не уходит за нижний край холста. */
export const DM_SCREEN_WINDOW_HEADER_HEIGHT = 40;

/** Сколько подсвечивается окно, на которое указали вместо нового, мс. */
export const DM_SCREEN_HIGHLIGHT_DURATION = 1500;

/**
 * Насколько близко к боковому краю холста нужно подвести указатель, чтобы
 * окно заняло половину холста, px.
 */
export const DM_SCREEN_EDGE_DISTANCE = 24;

/**
 * Высота полосы у края холста, px: пока указатель с окном в ней, видна
 * панель раскладок. Если панель выше (раскладки перенеслись на вторую
 * строку), полоса растёт вместе с ней.
 */
export const DM_SCREEN_PICKER_BAND = 132;

/** Отступ панели раскладок от края холста, px. */
export const DM_SCREEN_PICKER_OFFSET = 8;

/** Ключ настройки панели раскладок в localStorage. */
export const DM_SCREEN_PICKER_STORAGE_KEY = 'dm-screen:layout-picker';

/** Где панель раскладок стоит, пока мастер не выбрал другое. */
export const DM_SCREEN_PICKER_DEFAULT: ScreenPickerPlacement = 'top';

/** У какого края холста стоит панель раскладок, когда она видна. */
export const DM_SCREEN_PICKER_CLASS = {
  top: 'top-2',
  bottom: 'bottom-2',
} as const;

/** Варианты настройки панели раскладок в меню ширмы. */
export const DM_SCREEN_PICKER_OPTIONS: ReadonlyArray<ScreenPickerOption> = [
  { placement: 'top', label: 'Сверху', icon: 'tabler:layout-navbar' },
  { placement: 'bottom', label: 'Снизу', icon: 'tabler:layout-bottombar' },
  { placement: 'hidden', label: 'Скрыть', icon: 'tabler:eye-off' },
];

/** Атрибут места в панели раскладок: по нему место находят под указателем. */
export const DM_SCREEN_ZONE_ATTRIBUTE = 'data-dm-screen-zone';

/**
 * На сколько промежуток между окнами может отличаться от обычного, чтобы
 * окна считались соседними, px: место и размер окон округляются.
 */
export const DM_SCREEN_SPLITTER_TOLERANCE = 1;

/**
 * Размер холста, пока ширма не открыта: запись кладут на неё с другой
 * страницы. Из окна браузера вычитаются боковая панель сайта и шапка ширмы.
 */
export const DM_SCREEN_BOARD_INSET = { width: 64, height: 72 } as const;

/**
 * Наибольший размер запроса, который браузер отправляет при закрытии
 * страницы (`keepalive`), байт. С запасом от предела в 64 КБ.
 */
export const DM_SCREEN_KEEPALIVE_MAX_BYTES = 60000;

/** Сколько записей показывает поиск на ширме. */
export const DM_SCREEN_SEARCH_LIMIT = 12;

/** С какой длины запроса поиск обращается к серверу. */
export const DM_SCREEN_SEARCH_MIN_LENGTH = 2;

/** Пауза после набора перед поиском, мс. */
export const DM_SCREEN_SEARCH_DELAY = 300;

/** Поиск по всему сайту. */
export const DM_SCREEN_SEARCH_API_PATH = '/api/v2/full-text-search';

/**
 * Ровная сетка мест раскладки: одинаковые клетки слева направо, сверху
 * вниз.
 * @param columns - сколько колонок
 * @param rows - сколько рядов
 */
function createGridZones(
  columns: number,
  rows: number,
): Array<ScreenLayoutZone> {
  return Array.from({ length: columns * rows }, (_, index) => ({
    left: (index % columns) / columns,
    top: Math.floor(index / columns) / rows,
    width: 1 / columns,
    height: 1 / rows,
  }));
}

/** Две половины холста: в них окно встаёт и у боковых краёв. */
export const DM_SCREEN_HALVES_LAYOUT: ScreenLayout = {
  key: 'columns-2',
  zones: createGridZones(2, 1),
};

/**
 * Раскладки в панели, которая появляется, когда окно тащат к краю холста.
 * Панель показывает только те, чьи места на холсте не меньше наименьшего
 * окна: шесть колонок встают лишь на широком экране.
 */
export const DM_SCREEN_LAYOUTS: ReadonlyArray<ScreenLayout> = [
  DM_SCREEN_HALVES_LAYOUT,
  { key: 'columns-3', zones: createGridZones(3, 1) },
  { key: 'columns-4', zones: createGridZones(4, 1) },
  { key: 'columns-6', zones: createGridZones(6, 1) },
  { key: 'grid-2x2', zones: createGridZones(2, 2) },
  { key: 'grid-3x2', zones: createGridZones(3, 2) },
  { key: 'grid-4x2', zones: createGridZones(4, 2) },
  { key: 'grid-6x2', zones: createGridZones(6, 2) },
  { key: 'grid-3x3', zones: createGridZones(3, 3) },
  { key: 'grid-4x3', zones: createGridZones(4, 3) },
  { key: 'grid-6x3', zones: createGridZones(6, 3) },
  {
    key: 'main-half',
    zones: [
      { left: 0, top: 0, width: 0.5, height: 1 },
      { left: 0.5, top: 0, width: 0.5, height: 0.5 },
      { left: 0.5, top: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    key: 'main-wide',
    zones: [
      { left: 0, top: 0, width: 2 / 3, height: 1 },
      { left: 2 / 3, top: 0, width: 1 / 3, height: 0.5 },
      { left: 2 / 3, top: 0.5, width: 1 / 3, height: 0.5 },
    ],
  },
];

/**
 * Ручки растягивания окна: четыре стороны и четыре угла. Углы идут после
 * сторон, поэтому в разметке лежат поверх них.
 */
export const DM_SCREEN_RESIZE_HANDLES: ReadonlyArray<ScreenResizeHandle> = [
  {
    key: 'top',
    edges: { horizontal: 0, vertical: -1 },
    class: 'inset-x-0 top-0 h-1.5 cursor-ns-resize',
  },
  {
    key: 'bottom',
    edges: { horizontal: 0, vertical: 1 },
    class: 'inset-x-0 bottom-0 h-1.5 cursor-ns-resize',
  },
  {
    key: 'left',
    edges: { horizontal: -1, vertical: 0 },
    class: 'inset-y-0 left-0 w-1.5 cursor-ew-resize',
  },
  {
    key: 'right',
    edges: { horizontal: 1, vertical: 0 },
    class: 'inset-y-0 right-0 w-1.5 cursor-ew-resize',
  },
  {
    key: 'top-left',
    edges: { horizontal: -1, vertical: -1 },
    class: 'top-0 left-0 size-3 cursor-nwse-resize',
  },
  {
    key: 'top-right',
    edges: { horizontal: 1, vertical: -1 },
    class: 'top-0 right-0 size-3 cursor-nesw-resize',
  },
  {
    key: 'bottom-left',
    edges: { horizontal: -1, vertical: 1 },
    class: 'bottom-0 left-0 size-3 cursor-nesw-resize',
  },
  {
    key: 'bottom-right',
    edges: { horizontal: 1, vertical: 1 },
    class: 'right-0 bottom-0 size-3 cursor-nwse-resize',
  },
];

/** Заголовок и описание страницы ширмы для поисковиков. */
export const DM_SCREEN_SEO = {
  title: 'Ширма Мастера [DM Screen] — D&D 5',
  description:
    'Ширма Мастера для D&D 5: соберите на одном экране заклинания, существ, правила и свои заметки. Каждая запись — отдельное окно, которое можно двигать, растягивать и сворачивать.',
} as const;

/** Ключ кеша поиска на ширме. */
export const DM_SCREEN_SEARCH_KEY = 'dm-screen-search';

/** Сколько строк-заглушек видно, пока запись в окне грузится. */
export const DM_SCREEN_SKELETON_LINES = 5;

/** Высота ширмы: с окнами она занимает экран, списком — растёт. */
export const DM_SCREEN_BOARD_CLASS = {
  windowed: 'h-dvh overflow-hidden',
  list: 'min-h-dvh',
} as const;

/**
 * Вид окна в особых состояниях: рамка окна, на которое указали вместо
 * создания нового, и второй план, пока в раскладку подбирают окна (размытие,
 * а в режиме «производительность», где оно выключено, — приглушение).
 */
export const DM_SCREEN_WINDOW_CLASS = {
  highlighted: 'ring-2 ring-primary',
  dimmed: 'blur-sm performance:opacity-40 performance:blur-none',
} as const;

/** Кнопки шапки окна, обычные и ссылкой: с них окно не тянется. */
export const DM_SCREEN_CONTROL_SELECTOR = 'button, a';

/** Внутри чего клик по ссылке ставит курсор, а не открывает запись. */
export const DM_SCREEN_EDITABLE_SELECTOR =
  '[contenteditable="true"], textarea, input';

/** Ссылки в содержимом окна. */
export const DM_SCREEN_LINK_SELECTOR = 'a[href]';

/** Как окно открывает страницы сайта, которые не встают на ширму. */
export const DM_SCREEN_NEW_TAB = {
  target: '_blank',
  features: 'noopener',
} as const;

/** Вид места в панели раскладок: под указателем и остальные. */
export const DM_SCREEN_ZONE_CLASS = {
  active: 'border-primary bg-primary/40',
  idle: 'border-accented bg-accented/40',
} as const;

/** Курсор общей границы окон и размер полоски на ней. */
export const DM_SCREEN_SPLITTER_CLASS = {
  vertical: { root: 'cursor-ew-resize', bar: 'h-16 max-h-full w-1' },
  horizontal: { root: 'cursor-ns-resize', bar: 'h-1 w-16 max-w-full' },
} as const;

/** Полоска на границе, пока её тянут: видна и без наведения. */
export const DM_SCREEN_SPLITTER_ACTIVE_CLASS = 'opacity-100';

/** Отметка в поиске: запись уже на ширме или ещё нет. */
export const DM_SCREEN_SEARCH_MARK_CLASS = {
  added: 'text-primary',
  idle: 'text-muted',
} as const;

/** Иконки кнопок ширмы. */
export const DM_SCREEN_ICONS = {
  note: 'tabler:note',
  unknown: 'tabler:file-unknown',
  search: 'tabler:search',
  add: 'tabler:layout-grid-add',
  arrange: 'tabler:layout-grid',
  minimizeAll: 'tabler:layout-bottombar-collapse',
  restoreAll: 'tabler:layout-bottombar-expand',
  pickerSettings: 'tabler:adjustments-horizontal',
  clear: 'tabler:trash',
  minimize: 'tabler:minus',
  close: 'tabler:x',
  openPage: 'tabler:external-link',
  edit: 'tabler:pencil',
  done: 'tabler:check',
  signIn: 'tabler:login',
  error: 'tabler:alert-triangle',
  loading: 'tabler:loader-2',
} as const;

/** Подписи ширмы. */
export const DM_SCREEN_TEXT = {
  add: 'В ширму',
  added: 'Добавлено в ширму',
  alreadyAdded: 'Уже в ширме',
  openScreen: 'Открыть ширму',
  searchPlaceholder: 'Найти и добавить в ширму…',
  searchEmpty: 'Ничего не нашлось',
  emptyTitle: 'Ширма пуста',
  emptyDescription:
    'Найдите заклинание, существо, правило или другую запись поиском выше либо нажмите «В ширму» на её карточке. Каждая запись встанет отдельным окном: его можно двигать, растягивать и сворачивать.',
  guestHint:
    'Войдите, чтобы ширма сохранялась в аккаунте и открывалась на любом устройстве.',
  signIn: 'Войти',
  addNote: 'Заметка',
  arrange: 'Выровнять по сетке',
  minimizeAll: 'Свернуть все',
  restoreAll: 'Развернуть все',
  pickerSettings: 'Панель раскладок',
  clear: 'Очистить',
  clearTitle: 'Очистить ширму?',
  clearDescription: 'Все окна и заметки пропадут с ширмы. Это нельзя отменить.',
  cancel: 'Отмена',
  minimize: 'Свернуть окно',
  restore: 'Развернуть окно',
  close: 'Закрыть окно',
  remove: 'Убрать из ширмы',
  openPage: 'Открыть страницу записи',
  dock: 'Свёрнутые окна ширмы',
  noteTitle: 'Заметка',
  noteTitlePlaceholder: 'Название заметки',
  notePlaceholder: 'Текст заметки',
  noteEdit: 'Править',
  noteDone: 'Готово',
  noteEmpty: 'Заметка пуста. Нажмите «Править», чтобы написать её.',
  noteTooLong:
    'Заметка слишком длинная: сократите её, иначе она не сохранится.',
  assistTitle: 'Что поставить сюда?',
  assistSkip: 'Пропустить',
  assistStop: 'Закончить',
  entryFailed: 'Не удалось загрузить запись',
  unknownEntry: 'Эту запись нельзя показать в ширме',
  loadFailed: 'Не удалось открыть ширму из аккаунта',
  loadFailedDescription:
    'Можно повторить попытку или поработать с ширмой этого браузера: она не сохранится в аккаунте.',
  retry: 'Повторить',
  useLocal: 'Ширма этого браузера',
  saveFailed: 'Не удалось сохранить ширму',
  addFailed: 'Не удалось добавить в ширму',
  limitReached: 'На ширме слишком много окон: закройте лишние',
  unknownError: 'Неизвестная ошибка',
} as const;
