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

/** URL API микросервиса баг-репортов через локальный прокси */
export const BUG_REPORT_API_URL = '/api/bug-report';

/** URL API получения количества багов текущего пользователя */
export const BUG_REPORT_MY_COUNT_API_URL = `${BUG_REPORT_API_URL}/my/count-by-status`;

/** URL API получения общей статистики по баг-репортам */
export const BUG_REPORT_STATS_API_URL = `${BUG_REPORT_API_URL}/stats`;

/** URL API получения списка баг-репортов (админка) */
export const ADMIN_BUGS_API_URL = '/api/admin/bugs';

/** URL API получения количества баг-репортов по каждому статусу (админка) */
export const ADMIN_BUGS_COUNT_BY_STATUS_API_URL = `${ADMIN_BUGS_API_URL}/count-by-status`;

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
  'Просмотр списка сообщений об ошибках, фильтрация по статусу и платформе.';

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

/** Ключ кеша баг-репорта, догруженного по ID из ссылки, в админке */
export const ADMIN_BUG_SELECTED_DATA_KEY = 'admin-bug-selected';

/** Подпись стата «всего найдено багов» в шапке админки */
export const ADMIN_BUGS_STAT_TOTAL_LABEL = 'Всего найдено';

/** Значение фильтра "Все статусы" */
export const ADMIN_BUGS_STATUS_ALL_LABEL = 'Все статусы';

/** Значение фильтра "Все платформы" */
export const ADMIN_BUGS_PLATFORM_ALL_LABEL = 'Все платформы';

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

/** Значение фильтра "Все" для статуса/платформы */
export const ADMIN_BUGS_FILTER_ALL = 'ALL';

/** Ключ URL-параметра с фильтром по статусу */
export const ADMIN_BUGS_STATUS_QUERY_KEY = 'status';

/** Ключ URL-параметра с фильтром по платформе */
export const ADMIN_BUGS_PLATFORM_QUERY_KEY = 'platform';

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
