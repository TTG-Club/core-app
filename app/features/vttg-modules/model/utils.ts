import type {
  ModuleSubmission,
  SubmissionLink,
  SubmissionRequest,
  SubmissionStatus,
} from './types';

import {
  ALLOWED_ICON_PREFIXES,
  APPROVABLE_STATUSES,
  CARD_DOWNLOAD_ICON,
  CARD_DOWNLOAD_LABEL,
  CARD_MANIFEST_ICON,
  CARD_MANIFEST_LABEL,
  CARD_REPOSITORY_ICON,
  CARD_REPOSITORY_LABEL,
  CARD_VERSION_PREFIX,
  CATALOG_STATUS,
  CLOSED_STATUSES,
  DEFAULT_MODULE_ICON,
  EDITABLE_STATUSES,
  MODERATION_AUTHOR_PREFIX,
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
 * Поля формы заявки: у правки — ссылка заявки, у новой заявки — пусто.
 * @param submission Заявка для правки; `null` — новая заявка.
 */
export function createSubmissionForm(
  submission: ModuleSubmission | null,
): SubmissionRequest {
  return {
    manifestUrl: submission?.manifestUrl ?? '',
  };
}

/**
 * Ссылки заявки: репозиторий, манифест и архив модуля.
 * @param submission Заявка.
 */
export function getSubmissionLinks(
  submission: ModuleSubmission,
): Array<SubmissionLink> {
  return [
    {
      label: CARD_REPOSITORY_LABEL,
      to: submission.repositoryUrl,
      icon: CARD_REPOSITORY_ICON,
    },
    {
      label: CARD_MANIFEST_LABEL,
      to: submission.manifestUrl,
      icon: CARD_MANIFEST_ICON,
    },
    {
      label: CARD_DOWNLOAD_LABEL,
      to: submission.module.downloadUrl,
      icon: CARD_DOWNLOAD_ICON,
    },
  ];
}

/**
 * Идентификатор модуля с версией одной строкой: `map-import v1.0.0`.
 * @param submission Заявка.
 */
export function getModuleVersionLabel(submission: ModuleSubmission): string {
  return `${submission.module.id} ${CARD_VERSION_PREFIX}${submission.module.version}`;
}

/**
 * Подпись автора заявки; без имени показываем его идентификатор.
 * @param submission Заявка.
 */
export function getSubmissionAuthorLabel(submission: ModuleSubmission): string {
  return `${MODERATION_AUTHOR_PREFIX}: ${submission.authorName ?? submission.authorId}`;
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
