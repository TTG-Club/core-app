/** Плейсхолдер поля поиска по фильтрам внутри дровера */
export const FILTER_DRAWER_SEARCH_PLACEHOLDER = 'Поиск по фильтрам...';

/** Плейсхолдер того же поля в дровере источников */
export const FILTER_SOURCES_SEARCH_PLACEHOLDER = 'Поиск по источникам...';

/** Адрес общего списка источников сайта: из него панель берёт названия */
export const FILTER_SOURCES_CATALOG_PATH = '/api/v2/source/search';

/** Ключ кэша этого списка: один на все панели выбора источников */
export const FILTER_SOURCES_CATALOG_KEY = 'filter-sources-catalog';

/**
 * Подпись кнопки панели, когда всё показанное уже отмечено; пока отмечено не
 * всё, на ней общая подпись «Выбрать все»
 */
export const FILTER_SOURCES_CLEAR_ALL_LABEL = 'Снять все';

/** Значки той же кнопки в двух её состояниях */
export const FILTER_SOURCES_SELECT_ALL_ICON = 'tabler:checks';
export const FILTER_SOURCES_CLEAR_ALL_ICON = 'tabler:square-off';

/**
 * Быстрые наборы над списком источников: одним нажатием отмечают целые группы
 * и снимают остальное. Ключи — типы источников из фильтров разделов.
 */
export const FILTER_SOURCES_PRESETS: ReadonlyArray<{
  id: string;
  label: string;
  keys: ReadonlyArray<string>;
}> = [
  { id: 'official', label: 'Только базовые', keys: ['OFFICIAL'] },
  {
    id: 'official-settings',
    label: 'Базовые и сеттинги',
    keys: ['OFFICIAL', 'SETTING'],
  },
];

/** Значок на месте обложки у источника без неё */
export const FILTER_SOURCES_COVER_PLACEHOLDER_ICON = 'tabler:book';

/** Отметка на обложке выбранного источника */
export const FILTER_SOURCES_SELECTED_ICON = 'tabler:check';

/** Значок поля поиска в панели источников */
export const FILTER_SOURCES_SEARCH_ICON = 'tabler:search';

/** Стрелка в шапке группы источников: повёрнута вниз у раскрытой группы */
export const FILTER_SOURCES_GROUP_TOGGLE_ICON = 'tabler:chevron-right';

/** Подпись кнопки, применяющей выбор источников */
export const FILTER_SOURCES_APPLY_LABEL = 'Применить';

/** Подпись и значок кнопки, возвращающей исходный набор источников */
export const FILTER_SOURCES_RESET_LABEL = 'Сбросить';
export const FILTER_SOURCES_RESET_ICON = 'tabler:trash';

/** Начало строки-сводки под заголовком панели: «Выбрано 3 из 24» */
export const FILTER_SOURCES_SUMMARY_PREFIX = 'Выбрано';

/** Связка в той же сводке и в счётчике группы */
export const FILTER_SOURCES_SUMMARY_SEPARATOR = 'из';

/** Плейсхолдер поля поиска по разделу в тулбаре */
export const FILTER_CONTROLS_SEARCH_PLACEHOLDER = 'Поиск...';

/** Заголовок дровера с условиями отбора */
export const FILTER_FILTERS_TITLE = 'Фильтры';

/** Заголовок дровера с источниками и подпись кнопки, его открывающей */
export const FILTER_SOURCES_TITLE = 'Источники';

/** Подпись кнопки, открывающей дровер отбора; на узких экранах её нет */
export const FILTER_CONTROLS_FILTER_LABEL = 'Фильтр';

/** Подпись кнопки, снимающей все условия отбора разом */
export const FILTER_CONTROLS_RESET_LABEL = 'Очистить фильтр';

/** Короткая подпись той же кнопки в шапке фильтров, встроенных в панель */
export const FILTER_INLINE_RESET_LABEL = 'Сбросить';

/** Подпись кнопки с группировкой и сортировкой списка раздела */
export const FILTER_CONTROLS_PRESENTATION_LABEL = 'Группировка и сортировка';

/** Значок той же кнопки */
export const FILTER_CONTROLS_PRESENTATION_ICON = 'tabler:arrows-sort';

/** Подпись кнопки, отдающей ссылку на текущий отбор */
export const FILTER_CONTROLS_SHARE_LABEL = 'Поделиться ссылкой';

/**
 * Значок «поделиться». У Apple он свой: системная форма со стрелкой вверх, и
 * на их устройствах привычна именно она.
 */
export const FILTER_SHARE_ICON = 'tabler:share';
export const FILTER_SHARE_ICON_APPLE = 'tabler:share-2';

/** Подпись крестика на плашке выбранного значения фильтра */
export const FILTER_ACTIVE_CHIP_REMOVE_LABEL = 'Снять фильтр';

/** Значок крестика на плашке выбранного значения фильтра */
export const FILTER_ACTIVE_CHIP_REMOVE_ICON = 'tabler:x';

/** Подпись крестика быстрой очистки поля поиска для скринридеров */
export const FILTER_SEARCH_CLEAR_LABEL = 'Очистить поиск';

/**
 * Порог, после которого дровер получает поле поиска: групп больше пяти. Разделы
 * вроде «Классов» (две группы, пять значений) помещаются на экран целиком, и
 * поле там — лишний элемент управления.
 */
export const MIN_GROUPS_FOR_SEARCH = 5;

/**
 * Второй порог: больше двадцати значений во всех группах дровера вместе.
 * Считаются именно все — источники разложены по трём небольшим группам, но
 * книг в них под сорок, и глазами нужную там ищут не быстрее, чем в одной
 * длинной группе.
 */
export const MIN_VALUES_FOR_SEARCH = 20;

/** Заголовок пустой выдачи, когда под запрос не подошла ни одна группа */
export const FILTER_SEARCH_EMPTY_TITLE = 'Ничего не найдено';

/** Подсказка под заголовком пустой выдачи */
export const FILTER_SEARCH_EMPTY_SUBTITLE = 'Попробуйте изменить запрос';

/**
 * Задержка перед пересчётом выдачи. Поиск перебирает все группы и значения на
 * каждое нажатие: у заклинаний это 17 групп и 177 значений. Дебаунс держит
 * перебор на паузах между нажатиями, само поле остаётся отзывчивым.
 */
export const FILTER_SEARCH_DEBOUNCE = 200;

/**
 * Размер страницы выдачи в пикере каталога. Меньше страницы раздела: в модалке
 * список узкий, и подгрузка хвоста при прокрутке дешевле длинного первого
 * запроса.
 */
export const CATALOG_PICKER_PAGE_SIZE = 30;

/**
 * Задержка перед запросом выдачи по введённому запросу: поиск идёт на сервер, и
 * запрос на каждое нажатие означал бы очередь ответов, которые всё равно
 * отбрасываются.
 */
export const CATALOG_PICKER_SEARCH_DEBOUNCE_MS = 300;

/**
 * Сколько записей отдаётся кнопке «Выбрать все» одним запросом.
 *
 * Взято с запасом над самым большим разделом: отметить нужно всё, что нашёл
 * отбор, а не загруженную прокруткой страницу. Предел всё же есть — иначе
 * промах по кнопке без фильтров вытянул бы раздел целиком.
 */
export const CATALOG_PICKER_SELECT_ALL_LIMIT = 1000;

/** Подпись переключателя, меняющего теги значений на ползунок диапазона */
export const FILTER_RANGE_LABEL = 'Диапазон';

/** Подпись переключателя, отмечающего все показанные значения группы */
export const FILTER_SELECT_ALL_LABEL = 'Выбрать все';

/** Подпись переключателя, превращающего выбор группы в исключение */
export const FILTER_EXCLUDE_LABEL = 'Исключать';

/**
 * Подписи ответа «нет» у группы с единственным значением — по названию этого
 * значения, каким его отдаёт сервер. Такая группа показывает оба ответа сразу:
 * «Требуется» и «Не требуется».
 */
export const FILTER_SINGLE_CHOICE_EXCLUDE_LABELS: Readonly<
  Record<string, string>
> = {
  Требуется: 'Не требуется',
  Есть: 'Нет',
  Да: 'Нет',
};

/** Отрицание для значения, которому своя подпись ответа «нет» не задана */
export const FILTER_SINGLE_CHOICE_EXCLUDE_PREFIX = 'Не';

/** Подпись переключателя, требующего совпадения по всем выбранным значениям */
export const FILTER_UNION_LABEL = 'Точное совпадение (AND)';
