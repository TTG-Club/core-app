import type {
  AdminBugFilterOption,
  BugReportResponse,
  BugReportStatusUpdatePayload,
  ParsedSelection,
} from './types';

import { ADMIN_BUGS_FILTER_ALL } from './constants';

/**
 * Возвращает копию баг-репорта с применёнными полями обновления статуса.
 *
 * @param bugReport Исходный баг-репорт.
 * @param payload Данные об обновлении статуса.
 */
export function applyBugStatusPatch(
  bugReport: BugReportResponse,
  payload: BugReportStatusUpdatePayload,
): BugReportResponse {
  return {
    ...bugReport,
    status: payload.status,
    statusUpdatedAt: payload.statusUpdatedAt,
    statusUpdatedBy: payload.statusUpdatedBy,
    statusComment: payload.statusComment,
  };
}

/**
 * Разбирает выделенный на странице текст на контекст до, сам выделенный
 * фрагмент и контекст после.
 *
 * Выделенный фрагмент помечен квадратными скобками — так его сохраняет форма
 * отправки репорта. Если скобок нет, весь текст считается выделением, а
 * контекст остаётся пустым.
 *
 * @param selectedText Сохранённый текст выделения со скобками-маркерами.
 */
export function parseSelectedText(selectedText: string): ParsedSelection {
  const startIndex = selectedText.indexOf('[');
  const endIndex = selectedText.indexOf(']');

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return {
      before: selectedText.slice(0, startIndex),
      selected: selectedText.slice(startIndex + 1, endIndex),
      after: selectedText.slice(endIndex + 1),
      hasSelection: true,
    };
  }

  return {
    before: '',
    selected: selectedText,
    after: '',
    hasSelection: false,
  };
}

/**
 * Значение фильтра админки баг-репортов для API: пункт «все» означает
 * отсутствие параметра.
 *
 * @param filterValue Текущее значение фильтра.
 */
export function toAdminBugFilterApiValue(
  filterValue: string,
): string | undefined {
  return filterValue === ADMIN_BUGS_FILTER_ALL ? undefined : filterValue;
}

/**
 * Пункты выпадающего списка логинов для фильтра админки: «все» и сами логины.
 *
 * @param allLabel Подпись пункта «все».
 * @param logins Логины с сервера.
 */
export function buildLoginFilterOptions(
  allLabel: string,
  logins: ReadonlyArray<string>,
): AdminBugFilterOption[] {
  return [
    { label: allLabel, value: ADMIN_BUGS_FILTER_ALL },
    ...logins.map((login) => ({ label: login, value: login })),
  ];
}
