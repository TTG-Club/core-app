import type {
  AdminBugFilterOption,
  BugReportResponse,
  BugReportStatusUpdatePayload,
  BugReportType,
  ParsedSelection,
} from './types';

import { getNodeText, parse, toMarkupSource } from '~ui/markup';

import {
  ADMIN_BUGS_FILTER_ALL,
  BUG_REPORT_TYPE_QUERY_VALUES,
  BUG_REPORT_TYPES,
  DEFAULT_BUG_REPORT_TYPE,
} from './constants';

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
 * Приводит сохранённое описание баг-репорта к абзацам-исходникам для `MarkupRender`.
 *
 * Описание хранится строкой: новые репорты — исходником разметки `{@...}` из
 * редактора (абзацы разделены пустой строкой), старые — обычным текстом, а
 * JSON-строку AST на всякий случай разворачивает `toMarkupSource`. Каждый абзац
 * рендер разбирает сам: блочные маркеры (заголовок, список, цитата) рисуются
 * блоками, остальное — обычным абзацем текста.
 *
 * @param description Сохранённое описание баг-репорта.
 */
export function toBugReportDescriptionBlocks(description: string): string[] {
  return toMarkupSource(description)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * Текст описания без маркеров разметки — для порогов по длине (свернуть/раскрыть),
 * чтобы служебные символы `{@...}` не считались за текст.
 *
 * @param description Сохранённое описание баг-репорта.
 */
export function getBugReportDescriptionText(description: string): string {
  return getNodeText(parse(toMarkupSource(description)));
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

/**
 * Проверяет, что значение — известный тип записи (баг или пожелание).
 *
 * @param value Проверяемое значение (например, из события переключателя).
 */
export function isBugReportType(value: unknown): value is BugReportType {
  return BUG_REPORT_TYPES.find((type) => type === value) !== undefined;
}

/**
 * Тип записи с учётом старого сервиса, который поля `type` ещё не отдаёт:
 * такая запись — баг.
 *
 * @param type Тип из ответа сервиса, если он есть.
 */
export function resolveBugReportType(
  type: BugReportType | undefined,
): BugReportType {
  return type ?? DEFAULT_BUG_REPORT_TYPE;
}

/**
 * Тип записей из URL-параметра. Отсутствующее, пустое и неизвестное значение
 * означает баги — так произвольная строка из адреса не уйдёт в API.
 *
 * @param queryValue Значение параметра из `route.query`.
 */
export function parseBugReportTypeQuery(queryValue: unknown): BugReportType {
  if (typeof queryValue !== 'string' || !queryValue) {
    return DEFAULT_BUG_REPORT_TYPE;
  }

  return (
    BUG_REPORT_TYPES.find(
      (type) => BUG_REPORT_TYPE_QUERY_VALUES[type] === queryValue,
    ) ?? DEFAULT_BUG_REPORT_TYPE
  );
}

/**
 * Значение URL-параметра для типа записей. Тип по умолчанию в адрес не
 * пишется — параметр убирается.
 *
 * @param type Выбранный тип записей.
 */
export function toBugReportTypeQuery(type: BugReportType): string | undefined {
  return type === DEFAULT_BUG_REPORT_TYPE
    ? undefined
    : BUG_REPORT_TYPE_QUERY_VALUES[type];
}
