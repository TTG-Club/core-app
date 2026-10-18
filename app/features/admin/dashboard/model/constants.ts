export const ADMIN_DASHBOARD_PAGE_TITLE = 'Админ-панель';

export const ADMIN_DASHBOARD_STATS_TITLE = 'Статистика';

export const ADMIN_DASHBOARD_SECTIONS_TITLE = 'Разделы';

/** Панель накопленных счётчиков: листы и игры считаются за всё время, а не за окно. */
export const ADMIN_DASHBOARD_TOTALS_TITLE = 'За всё время';

export const ADMIN_DASHBOARD_REFRESH_LABEL = 'Обновить';

export const ADMIN_DASHBOARD_REFRESH_ICON = 'tabler:refresh';

/** Подпись и подсказка кнопки создания записи рядом с разделом. */
export const ADMIN_DASHBOARD_CREATE_LABEL = 'Создать';

export const ADMIN_DASHBOARD_CREATE_ICON = 'tabler:plus';

/** Значок у заголовка панели, за которым спрятано пояснение. */
export const ADMIN_DASHBOARD_HINT_ICON = 'tabler:info-circle';

/** Значение, которого нет: числа не выдумываем, ставим прочерк. */
export const ADMIN_DASHBOARD_EMPTY_VALUE = '—';

/**
 * Подсказки дашборда — целые фразы, а у тултипа по умолчанию одна строка с
 * обрезкой. Здесь текст переносится и ограничен по ширине.
 */
export const ADMIN_DASHBOARD_TOOLTIP_UI = {
  content: 'h-auto max-w-72 py-1.5',
  text: 'whitespace-normal',
};
