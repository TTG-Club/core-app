import type { BrushColor, BugReportStatus } from './types';

import { SOURCE_PLATFORM_LABELS } from '#shared/consts';

/** Предустановленные цвета кисти для рисования на скриншоте */
export const BRUSH_COLORS: ReadonlyArray<BrushColor> = [
  { name: 'yellow', value: '#FACC15' },
  { name: 'red', value: '#EF4444' },
  { name: 'green', value: '#22C55E' },
  { name: 'blue', value: '#3B82F6' },
  { name: 'orange', value: '#F97316' },
  { name: 'white', value: '#FFFFFF' },
];

/** Цвет кисти по умолчанию (жёлтый) */
export const DEFAULT_BRUSH_COLOR: BrushColor = BRUSH_COLORS[0] || {
  name: 'yellow',
  value: '#FACC15',
};

/** Размер кисти по умолчанию (в пикселях) */
export const DEFAULT_BRUSH_SIZE = 4;

/** Максимальное количество шагов отмены (undo) */
export const MAX_UNDO_STEPS = 50;

/** Количество символов контекста до/после выделенного текста */
export const SELECTION_CONTEXT_LENGTH = 50;

/** Ширина «хрома» модалки (форма + toolbar + отступы), вычитается из viewport для canvas */
export const MODAL_CHROME_WIDTH = 560;

/**
 * Предел длинной стороны сохраняемого скриншота в пикселях.
 *
 * Экранный размер картинки ограничен модалкой, а сохраняется оригинал: предел
 * пропускает 4K целиком и страхует только от панорам на несколько мониторов,
 * которые упёрлись бы в лимит загрузки сервиса (10 МБ на файл).
 */
export const MAX_SCREENSHOT_EXPORT_SIZE = 3840;

/**
 * MIME-тип сохраняемого скриншота.
 *
 * Сервис баг-репортов перегоняет png и jpeg в webp у себя, но отправлять
 * полноразмерный png — это лишние мегабайты в канал репортёра; webp уходит
 * готовым и складывается в S3 как есть.
 */
export const SCREENSHOT_EXPORT_MIME = 'image/webp';

/** Качество webp-сжатия скриншота: текст на снимке экрана остаётся читаемым */
export const SCREENSHOT_EXPORT_QUALITY = 0.92;

/**
 * Имя отправляемого файла скриншота в webp.
 *
 * Расширение обязано совпадать с типом blob-а: для уже сжатого webp сервис
 * баг-репортов берёт расширение ключа в S3 именно из имени файла.
 */
export const SCREENSHOT_FILE_NAME_WEBP = 'screenshot.webp';

/** Имя файла скриншота, когда браузер не умеет кодировать webp и вернул png */
export const SCREENSHOT_FILE_NAME_PNG = 'screenshot.png';

/** URL API микросервиса баг-репортов через локальный прокси */
export const BUG_REPORT_API_URL = '/api/bug-report';

/** URL API получения количества багов текущего пользователя */
export const BUG_REPORT_MY_COUNT_API_URL = `${BUG_REPORT_API_URL}/my/count-by-status`;

/** URL API получения общей статистики по баг-репортам */
export const BUG_REPORT_STATS_API_URL = `${BUG_REPORT_API_URL}/stats`;

/** URL API получения списка баг-репортов текущего пользователя */
export const BUG_REPORT_MY_API_URL = `${BUG_REPORT_API_URL}/my`;

/** URL API сводки изменений по баг-репортам текущего пользователя */
export const BUG_REPORT_MY_UPDATES_API_URL = `${BUG_REPORT_API_URL}/my/updates`;

/** URL API получения списка баг-репортов (админка) */
export const ADMIN_BUGS_API_URL = '/api/admin/bugs';

/** URL API получения количества баг-репортов по каждому статусу (админка) */
export const ADMIN_BUGS_COUNT_BY_STATUS_API_URL = `${ADMIN_BUGS_API_URL}/count-by-status`;

/** URL API значений для фильтров списка: логины авторов и менявших статус (админка) */
export const ADMIN_BUGS_FILTER_OPTIONS_API_URL = `${ADMIN_BUGS_API_URL}/filter-options`;

/**
 * Платформа-источник бага. Реэкспорт из `#shared/consts`: идентичность сайта —
 * общее знание, её нельзя разнести по константам двух фич.
 */
export { SOURCE_PLATFORM } from '#shared/consts';
/**
 * Набор статусов баг-репорта в порядке отображения. Реэкспорт из `#shared/consts`:
 * тем же списком серверная ручка считает сводку по статусам.
 */
export { BUG_REPORT_STATUSES } from '#shared/consts';

/**
 * Возвращает URL для получения одного баг-репорта по ID (админка).
 *
 * @param bugId Уникальный идентификатор бага.
 */
export function getAdminBugApiUrl(bugId: string): string {
  return `${ADMIN_BUGS_API_URL}/${bugId}`;
}

/**
 * Возвращает URL для обновления статуса баг-репорта.
 *
 * @param bugId Уникальный идентификатор бага.
 */
export function getAdminBugStatusApiUrl(bugId: string): string {
  return `${ADMIN_BUGS_API_URL}/${bugId}/status`;
}

/** Заголовок страницы админки баг-репортов */
export const ADMIN_BUGS_PAGE_TITLE = 'Баг-репорты: список';

/** Заголовок в шапке layout'а на странице баг-репортов */
export const ADMIN_BUGS_LAYOUT_TITLE = 'Баг-репорты';

/** Текст на кнопке возврата/в навигации */
export const ADMIN_BUGS_NAVIGATION_LABEL = 'Баги';

/** Текст кнопки настройки/просмотра на главной странице админки */
export const ADMIN_BUGS_CONFIGURE_LABEL = 'Посмотреть';

/** Описание раздела админки баг-репортов */
export const ADMIN_BUGS_PAGE_DESCRIPTION =
  'Просмотр списка сообщений об ошибках, фильтрация по статусу, платформе, автору и тому, кто менял статус.';

/** Текст при пустом списке баг-репортов */
export const ADMIN_BUGS_EMPTY_TEXT = 'Баг-репорты не найдены';

/** Текст при ошибке загрузки списка баг-репортов */
export const ADMIN_BUGS_LOAD_ERROR_TEXT =
  'Не удалось загрузить список баг-репортов.';

/** Текст кнопки повторной загрузки списка */
export const ADMIN_BUGS_RETRY_LABEL = 'Повторить попытку';

/** Заголовок заглушки, когда баг-репорт не выбран */
export const ADMIN_BUGS_DETAIL_EMPTY_TITLE = 'Баг-репорт не выбран';

/** Текст заглушки, когда баг-репорт не выбран */
export const ADMIN_BUGS_DETAIL_EMPTY_TEXT =
  'Выберите сообщение об ошибке из списка слева, чтобы просмотреть подробную информацию';

/** Ключ кеша сводки количества баг-репортов по статусам в админке */
export const ADMIN_BUGS_STATUS_COUNTS_DATA_KEY = 'admin-bugs-status-counts';

/** Ключ кеша значений для фильтров списка (логины) в админке */
export const ADMIN_BUGS_FILTER_OPTIONS_DATA_KEY = 'admin-bugs-filter-options';

/** Ключ кеша баг-репорта, догруженного по ID из ссылки, в админке */
export const ADMIN_BUG_SELECTED_DATA_KEY = 'admin-bug-selected';

/** Подпись стата «всего найдено багов» в шапке админки */
export const ADMIN_BUGS_STAT_TOTAL_LABEL = 'Всего найдено';

/** Значение фильтра "Все статусы" */
export const ADMIN_BUGS_STATUS_ALL_LABEL = 'Все статусы';

/** Значение фильтра "Все платформы" */
export const ADMIN_BUGS_PLATFORM_ALL_LABEL = 'Все платформы';

/** Значение фильтра «Все авторы» */
export const ADMIN_BUGS_AUTHOR_ALL_LABEL = 'Все авторы';

/**
 * Значение фильтра «Все исполнители». Исполнитель — тот, кто последним менял
 * статус репорта: вместе с фильтром по статусу «Исправлен» это и есть «кто исправил».
 */
export const ADMIN_BUGS_RESOLVER_ALL_LABEL = 'Все исполнители';

/** Подсказка в поле поиска выпадающих списков авторов и исполнителей */
export const ADMIN_BUGS_LOGIN_SEARCH_PLACEHOLDER = 'Поиск по логину…';

/** Мапа русских названий для статусов баг-репортов */
export const BUG_REPORT_STATUS_LABELS: Record<BugReportStatus, string> = {
  NEW: 'Новый',
  WAIT: 'В ожидании',
  FIXED: 'Исправлен',
  REJECTED: 'Отклонен',
};

/**
 * Мапа русских названий для платформ. Сам набор живёт в `#shared/consts`: теми же
 * подписями пользуется лента модерации комментариев.
 */
export const BUG_REPORT_PLATFORM_LABELS = SOURCE_PLATFORM_LABELS;

/** Маппинг статусов баг-репорта на цвета компонента UBadge */
const BUG_REPORT_STATUS_COLOR_MAP: Record<
  BugReportStatus,
  'warning' | 'info' | 'success' | 'error'
> = {
  NEW: 'warning',
  WAIT: 'info',
  FIXED: 'success',
  REJECTED: 'error',
};

/**
 * Возвращает цвет бейджа в зависимости от статуса баг-репорта.
 *
 * @param status Статус баг-репорта.
 */
export function getBugReportStatusColor(
  status: BugReportStatus,
): 'warning' | 'info' | 'success' | 'error' {
  return BUG_REPORT_STATUS_COLOR_MAP[status];
}

/** Подсказка к усечённому UUID в строке списка */
export const BUG_REPORT_UUID_TITLE = 'UUID баг-репорта';

/** Подсказка к дате создания в строке списка */
export const BUG_REPORT_CREATED_AT_TITLE = 'Дата создания';

/** Подсказки к иконке скриншота: приложен и не приложен */
export const BUG_REPORT_SCREENSHOT_PRESENT_TITLE = 'Есть скриншот';
export const BUG_REPORT_SCREENSHOT_ABSENT_TITLE = 'Нет скриншота';

/** Подсказки к иконке выделенного текста: есть и нет */
export const BUG_REPORT_SELECTION_PRESENT_TITLE = 'Есть выделенный текст';
export const BUG_REPORT_SELECTION_ABSENT_TITLE = 'Нет выделенного текста';

/** Подсказки к иконке комментария: есть и нет */
export const BUG_REPORT_COMMENT_PRESENT_TITLE = 'Есть комментарий';
export const BUG_REPORT_COMMENT_ABSENT_TITLE = 'Нет комментария';

/** Подсказка к идентификатору в детальном просмотре */
export const BUG_REPORT_COPY_ID_TITLE = 'Нажмите, чтобы скопировать ID';

/** Имя анонимного пользователя по умолчанию */
export const BUG_REPORT_ANONYMOUS_USER = 'Аноним';

/** Имя анонимного пользователя в родительном падеже */
export const BUG_REPORT_ANONYMOUS_USER_GENITIVE = 'Анонима';

/** Формат даты создания для строки баг-репорта */
export const BUG_REPORT_DATE_FORMAT = 'DD.MM.YY HH:mm';

/** Формат подробной даты для детального просмотра */
export const BUG_REPORT_DETAIL_DATE_FORMAT = 'LLL';

/** Заголовок и описание успешной отправки репорта */
export const BUG_REPORT_SUBMIT_SUCCESS_TITLE = 'Репорт отправлен';
export const BUG_REPORT_SUBMIT_SUCCESS_DESC =
  'Спасибо за обратную связь! Мы рассмотрим ваш репорт.';

/** Заголовок и описание ошибки при отправке репорта */
export const BUG_REPORT_SUBMIT_ERROR_TITLE = 'Ошибка отправки';
export const BUG_REPORT_SUBMIT_ERROR_DESC =
  'Не удалось отправить баг-репорт. Пожалуйста, попробуйте позже.';

/** Placeholder поля описания проблемы в форме отправки */
export const BUG_REPORT_DESCRIPTION_PLACEHOLDER = 'Опишите, что произошло...';

/** Максимальная длина описания вместе с разметкой (ограничение API и колонки в базе) */
export const BUG_REPORT_DESCRIPTION_MAX_LENGTH = 2000;

/** Ошибка валидации: описание длиннее лимита API */
export const BUG_REPORT_DESCRIPTION_TOO_LONG_ERROR = `Описание вместе с разметкой не должно превышать ${BUG_REPORT_DESCRIPTION_MAX_LENGTH} символов`;

/** Успешный заголовок обновления статуса */
export const BUG_REPORT_STATUS_UPDATE_SUCCESS_TITLE = 'Статус обновлен';

/** Ошибка обновления статуса */
export const BUG_REPORT_STATUS_UPDATE_ERROR_TITLE = 'Ошибка обновления статуса';
export const BUG_REPORT_STATUS_UPDATE_ERROR_DESC =
  'Не удалось обновить статус баг-репорта на сервере';

/** Placeholder для поля ввода комментария при смене статуса */
export const BUG_REPORT_STATUS_COMMENT_PLACEHOLDER =
  'Комментарий к смене статуса (необязательно)';

/** Максимальная длина комментария (ограничение API) */
export const BUG_REPORT_STATUS_COMMENT_MAX_LENGTH = 2000;

/** Значение фильтра «Все» для статуса, платформы, автора и исполнителя */
export const ADMIN_BUGS_FILTER_ALL = 'ALL';

/** Ключ URL-параметра с фильтром по статусу */
export const ADMIN_BUGS_STATUS_QUERY_KEY = 'status';

/** Ключ URL-параметра с фильтром по платформе */
export const ADMIN_BUGS_PLATFORM_QUERY_KEY = 'platform';

/** Ключ URL-параметра с фильтром по логину автора */
export const ADMIN_BUGS_AUTHOR_QUERY_KEY = 'author';

/** Ключ URL-параметра с фильтром по логину исполнителя (кто менял статус) */
export const ADMIN_BUGS_RESOLVER_QUERY_KEY = 'resolver';

/** Ключ URL-параметра с идентификатором открытого баг-репорта */
export const ADMIN_BUGS_ID_QUERY_KEY = 'id';

/** Количество элементов на странице по умолчанию */
export const ADMIN_BUGS_DEFAULT_PAGE_SIZE = 20;

/** Параметры сортировки по умолчанию */
export const ADMIN_BUGS_DEFAULT_SORT = 'createdAt,desc';

/** Текст на кнопке сообщения об ошибке в выделенном тексте */
export const BUG_REPORT_SELECTION_BUTTON_LABEL = 'Ошибка в тексте';

/** Успешный заголовок обновления комментария */
export const BUG_REPORT_COMMENT_SAVE_SUCCESS_TITLE = 'Комментарий сохранен';

/** Текст успешного тоста сохранения комментария */
export const BUG_REPORT_COMMENT_SAVE_SUCCESS_DESC =
  'Комментарий к статусу успешно обновлен.';

/** Текст кнопки сохранения комментария */
export const BUG_REPORT_COMMENT_SAVE_BUTTON_LABEL = 'Сохранить';

/** Префикс-подпись строки «кто последним менял статус» */
export const BUG_REPORT_STATUS_UPDATED_BY_LABEL = 'Статус изменил';

/**
 * Подсказка модератору: комментарий к статусу виден автору репорта в его
 * профиле. Нужна, чтобы во внутреннее по виду поле не писали служебных заметок.
 */
export const BUG_REPORT_STATUS_COMMENT_PUBLIC_HINT =
  'Комментарий виден автору репорта в его профиле';

/* --- Раздел «Мои баг-репорты» в профиле --- */

/** Заголовок раздела и вкладки профиля */
export const MY_BUGS_TITLE = 'Мои баг-репорты';

/** Подпись вкладки в навигации профиля */
export const MY_BUGS_NAVIGATION_LABEL = 'Баг-репорты';

/** Путь раздела в профиле */
export const MY_BUGS_ROUTE = '/user/profile/bugs';

/** Описание раздела под заголовком */
export const MY_BUGS_DESCRIPTION =
  'Здесь видно, что стало с ошибками, о которых вы сообщили, и что ответила команда.';

/** Ключ кеша списка баг-репортов пользователя */
export const MY_BUGS_LIST_DATA_KEY = 'my-bugs-list';

/** Ключ кеша сводки количества баг-репортов пользователя по статусам */
export const MY_BUGS_STATUS_COUNTS_DATA_KEY = 'my-bugs-status-counts';

/** Ключ кеша сводки изменений по баг-репортам пользователя */
export const MY_BUGS_UPDATES_DATA_KEY = 'my-bugs-updates';

/**
 * Ключ localStorage с отметкой последнего просмотра раздела. Хранит строку
 * `lastStatusUpdatedAt`, полученную от сервера, а не клиентское время: сервер
 * отдаёт даты без часового пояса, и собственная метка браузера сравнивалась бы
 * с ними со сдвигом.
 */
export const MY_BUGS_SEEN_AT_STORAGE_KEY = 'bug-report:my-reports-seen-at';

/** Количество баг-репортов на странице в профиле */
export const MY_BUGS_PAGE_SIZE = 10;

/**
 * Сортировка списка: сначала свежие. Spring по умолчанию сортирует по
 * возрастанию, поэтому направление передаём явно.
 */
export const MY_BUGS_SORT = 'createdAt,desc';

/** Подпись плитки «все репорты» в сводке */
export const MY_BUGS_SUMMARY_ALL_LABEL = 'Все';

/** Заголовок блока с ответом команды в карточке */
export const MY_BUGS_COMMENT_TITLE = 'Ответ команды';

/**
 * Формат дат в карточке репорта. Компактнее локализованного `LLL`: дата
 * создания и дата обновления стоят в одной строке, и два «30 июля 2026 г.»
 * подряд её переполняли.
 */
export const MY_BUGS_DATE_FORMAT = 'DD.MM.YYYY, HH:mm';

/** Подпись даты создания репорта */
export const MY_BUGS_CREATED_AT_LABEL = 'Создан';

/** Подпись даты изменения статуса */
export const MY_BUGS_STATUS_UPDATED_AT_LABEL = 'Обновлён';

/** Подписи метки о том, что именно изменилось в репорте */
export const MY_BUGS_CHANGE_STATUS_LABEL = 'Обновили статус';
export const MY_BUGS_CHANGE_COMMENT_LABEL = 'Добавили комментарий';

/**
 * Подпись, когда изменение есть, но с чем сравнивать — неизвестно: снимок
 * прошлого просмотра появляется только после первого визита в раздел.
 */
export const MY_BUGS_CHANGE_GENERIC_LABEL = 'Есть обновление';

/** Ключ localStorage со снимками просмотренного состояния репортов */
export const MY_BUGS_SEEN_REPORTS_STORAGE_KEY = 'bug-report:my-reports-seen';

/**
 * Сколько снимков хранить. Ограничение нужно, чтобы карта в localStorage не
 * росла бесконечно у активных багхантеров; лишние отбрасываются, начиная с
 * самых старых по дате изменения.
 */
export const MY_BUGS_SEEN_REPORTS_LIMIT = 200;

/**
 * Сколько карточка должна пробыть на экране, чтобы считаться прочитанной.
 * Двух секунд хватает, чтобы отсечь пролистывание мимо.
 */
export const MY_BUGS_READ_DELAY_MS = 2_000;

/**
 * Пауза перед пересчётом сводки после отметки прочтения. Карточки читаются
 * пачкой — несколько попадают в зону видимости разом, — и запрос на каждую
 * означал бы залп, в котором выигрывает случайный ответ с устаревшей отметкой.
 */
export const MY_BUGS_SEEN_SETTLE_MS = 700;

/** Интервал фонового опроса изменений по репортам */
export const MY_BUGS_POLL_INTERVAL_MS = 30_000;

/**
 * Минимальный интервал между любыми двумя опросами. Защита от пачки запросов
 * при частом переключении вкладок — как в опросе подписок.
 */
export const MY_BUGS_POLL_COOLDOWN_MS = 10_000;

/** Потолок экспоненциального backoff, если сводка перестала отвечать */
export const MY_BUGS_POLL_MAX_BACKOFF_MS = 5 * 60_000;

/** Подсказка к точке-индикатору непросмотренных изменений */
export const MY_BUGS_UPDATES_HINT = 'Есть изменения по вашим баг-репортам';

/** Подписи кнопки раскрытия карточки */
export const MY_BUGS_EXPAND_LABEL = 'Подробнее';
export const MY_BUGS_COLLAPSE_LABEL = 'Свернуть';

/**
 * Длина описания, после которой карточка предлагает раскрытие. Порог по числу
 * символов, а не по реальному переполнению: замер высоты требовал бы обращения
 * к DOM на каждую карточку списка.
 */
export const MY_BUGS_DESCRIPTION_PREVIEW_LENGTH = 180;

/** Заголовок блока «страница, где найдена ошибка» */
export const MY_BUGS_URL_TITLE = 'Страница с ошибкой';

/** Заголовок блока с выделенным текстом */
export const MY_BUGS_SELECTION_TITLE = 'Выделенный текст';

/** Заголовок блока со скриншотом */
export const MY_BUGS_SCREENSHOT_TITLE = 'Скриншот';

/** Заголовок модалки с полным скриншотом */
export const MY_BUGS_SCREENSHOT_MODAL_TITLE = 'Скриншот к баг-репорту';

/** Alt-текст миниатюры и полного скриншота */
export const MY_BUGS_SCREENSHOT_ALT = 'Скриншот к баг-репорту';

/** Заголовок и текст пустого состояния */
export const MY_BUGS_EMPTY_TITLE = 'Вы ещё не сообщали об ошибках';
export const MY_BUGS_EMPTY_TEXT =
  'Нашли неточность или поломку — нажмите кнопку «Сообщить об ошибке» в боковом меню. Репорты, отправленные без входа в аккаунт, сюда не попадают.';

/** Заголовок и текст пустого состояния при активном фильтре по статусу */
export const MY_BUGS_EMPTY_FILTERED_TITLE = 'Нет репортов с таким статусом';
export const MY_BUGS_EMPTY_FILTERED_TEXT =
  'Выберите другой статус или посмотрите все репорты.';

/** Текст ошибки загрузки списка и подпись кнопки повтора */
export const MY_BUGS_LOAD_ERROR_TEXT = 'Не удалось загрузить ваши баг-репорты.';
export const MY_BUGS_RETRY_LABEL = 'Повторить попытку';
