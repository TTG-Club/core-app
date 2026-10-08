import type {
  ModuleSubmission,
  SubmissionRequest,
  SubmissionStatus,
} from './types';

import {
  ALLOWED_ICON_PREFIXES,
  APPROVABLE_STATUSES,
  CATALOG_STATUS,
  CLOSED_STATUSES,
  DEFAULT_MODULE_ICON,
  EDITABLE_STATUSES,
  REJECTABLE_STATUSES,
} from './constants';

/**
 * Можно ли исправить заявку и отправить её заново.
 * @param status Текущий статус заявки.
 */
export function isSubmissionEditable(status: SubmissionStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

/**
 * Закрыта ли заявка: отозвана автором или заменена новой одобренной.
 * @param status Текущий статус заявки.
 */
export function isSubmissionClosed(status: SubmissionStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}

/**
 * Может ли модератор одобрить заявку.
 * @param status Текущий статус заявки.
 */
export function canApproveSubmission(status: SubmissionStatus): boolean {
  return APPROVABLE_STATUSES.includes(status);
}

/**
 * Может ли модератор отклонить заявку или снять модуль из каталога.
 * @param status Текущий статус заявки.
 */
export function canRejectSubmission(status: SubmissionStatus): boolean {
  return REJECTABLE_STATUSES.includes(status);
}

/**
 * Стоит ли модуль в каталоге VTTG: тогда отклонение снимает его оттуда.
 * @param status Текущий статус заявки.
 */
export function isSubmissionInCatalog(status: SubmissionStatus): boolean {
  return status === CATALOG_STATUS;
}

/**
 * Поля формы заявки: у правки — данные заявки, у новой заявки — пустые.
 * @param submission Заявка для правки; `null` — новая заявка.
 */
export function createSubmissionForm(
  submission: ModuleSubmission | null,
): SubmissionRequest {
  return {
    manifestUrl: submission?.manifestUrl ?? '',
    description: submission?.description ?? '',
  };
}

/**
 * Значок модуля для карточки. Значок пишет автор в манифесте, а сайт
 * показывает только коллекции `tabler` и `ttg` — остальное заменяется общим.
 * @param icon Значок из манифеста.
 */
export function getModuleIcon(icon: string | null): string {
  if (icon && ALLOWED_ICON_PREFIXES.some((prefix) => icon.startsWith(prefix))) {
    return icon;
  }

  return DEFAULT_MODULE_ICON;
}

/**
 * Форматирует манифест для показа модератору.
 * @param manifest Манифест модуля как пришёл из репозитория.
 */
export function formatManifest(manifest: string): string {
  try {
    return JSON.stringify(JSON.parse(manifest), null, 2);
  } catch {
    return manifest;
  }
}
