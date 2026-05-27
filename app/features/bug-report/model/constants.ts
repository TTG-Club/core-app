import type { BrushColor, BugReportStatus, SourcePlatform } from './types';

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
export const DEFAULT_BRUSH_COLOR: BrushColor = {
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

/** URL API получения списка баг-репортов (админка) */
export const ADMIN_BUGS_API_URL = '/api/admin/bugs';

/** Платформа-источник бага для сайта TTG */
export const SOURCE_PLATFORM: SourcePlatform = 'SITE_5E24';

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

/** Текст на кнопке возврата/в навигации */
export const ADMIN_BUGS_NAVIGATION_LABEL = 'Баги';

/** Текст кнопки настройки/просмотра на главной странице админки */
export const ADMIN_BUGS_CONFIGURE_LABEL = 'Настроить';

/** Описание раздела админки баг-репортов */
export const ADMIN_BUGS_PAGE_DESCRIPTION =
  'Просмотр списка сообщений об ошибках, фильтрация по статусу и платформе.';

/** Текст при пустом списке баг-репортов */
export const ADMIN_BUGS_EMPTY_TEXT = 'Баг-репорты не найдены';

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

/** Мапа русских названий для платформ */
export const BUG_REPORT_PLATFORM_LABELS: Record<SourcePlatform, string> = {
  SITE_5E24: 'Сайт 2024',
  SITE_5E14: 'Сайт 2014',
  VTTG: 'VTTG',
};

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
): 'warning' | 'neutral' | 'success' | 'error' | 'info' {
  return BUG_REPORT_STATUS_COLOR_MAP[status] ?? 'neutral';
}
