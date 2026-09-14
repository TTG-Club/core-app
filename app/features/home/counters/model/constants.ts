export const MATERIAL_COUNTER_API_URL = '/api/v2/statistics/count-all';
export const MATERIAL_COUNTER_CACHE_API_URL = '/api/v2/cache/evict-all';
export const MATERIAL_COUNTER_DATA_KEY = 'material-counter';
export const MATERIAL_COUNTER_RESET_DATA_KEY = 'material-counter-reset-cache';

export const ONLINE_COUNTER_DATA_KEY = 'visitors-counter';

/** Ключ useAsyncData счётчика листов персонажей на главной */
export const SHEET_COUNTER_DATA_KEY = 'character-sheet-counter';

/** Подпись счётчика материалов */
export const MATERIAL_COUNTER_LABEL_MATERIALS = 'Материалов';

/** Подпись счётчика листов персонажей */
export const MATERIAL_COUNTER_LABEL_SHEETS = 'Персонажей';

/** Подпись счётчика исправленных багов */
export const MATERIAL_COUNTER_LABEL_FIXED = 'Багов исправлено';

/** Иконка счётчика материалов */
export const MATERIAL_COUNTER_ICON_MATERIALS = 'tabler:books';

/** Иконка счётчика листов персонажей */
export const MATERIAL_COUNTER_ICON_SHEETS = 'tabler:id';

/** Иконка счётчика исправленных багов */
export const MATERIAL_COUNTER_ICON_FIXED = 'tabler:bug';

/** Подпись кнопки сброса кеша и обновления статистики (только для админа) */
export const MATERIAL_COUNTER_REFRESH_LABEL =
  'Сбросить кеш и обновить статистику';

/** Интервал автообновления живых показателей (мс) — 60 секунд */
export const MATERIAL_COUNTER_REFRESH_INTERVAL_MS = 60 * 1000;
