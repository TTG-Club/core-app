/**
 * Статусы баг-репорта в микросервисе. Набор лежит в `shared`, а не в фиче: по нему
 * серверная ручка считает сводку «сколько багов в каждом статусе», а фронт рисует
 * фильтры и кнопки смены статуса. Разъехавшиеся списки означали бы молча
 * недосчитанные статусы в админке.
 */
export const BUG_REPORT_STATUSES = [
  'NEW',
  'WAIT',
  'FIXED',
  'REJECTED',
] as const;

/** Статус баг-репорта. */
export type BugReportStatus = (typeof BUG_REPORT_STATUSES)[number];

/**
 * Типы записей в сервисе баг-репортов: ошибка или пожелание. Набор лежит в
 * `shared` рядом со статусами: по нему серверные ручки проверяют параметр
 * `type`, а фронт рисует переключатели и подписи.
 */
export const BUG_REPORT_TYPES = ['BUG', 'WISH'] as const;

/** Тип записи в сервисе баг-репортов. */
export type BugReportType = (typeof BUG_REPORT_TYPES)[number];

/**
 * Тип по умолчанию: его подставляет сервис, когда тип не передан, и его же
 * считают записи из старого сервиса, который поля `type` ещё не отдаёт.
 */
export const DEFAULT_BUG_REPORT_TYPE: BugReportType = 'BUG';

/** Подписи типов записи в единственном числе. */
export const BUG_REPORT_TYPE_LABELS: Record<BugReportType, string> = {
  BUG: 'Баг-репорт',
  WISH: 'Пожелание',
};
