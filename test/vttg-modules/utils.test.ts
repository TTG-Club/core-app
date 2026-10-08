import type { ModuleSubmission } from '~vttg-modules/model';

import { describe, expect, it } from 'vitest';

import {
  canApproveSubmission,
  canRejectSubmission,
  DEFAULT_MODULE_ICON,
  getModuleIcon,
  getModuleVersionLabel,
  getSubmissionAuthorLabel,
  getSubmissionLinks,
  isSubmissionClosed,
  isSubmissionEditable,
  isSubmissionInCatalog,
  parseSubmissionsPage,
} from '~vttg-modules/model';

/**
 * Заявка с заданными системами и манифестом.
 * @param systemIds Системы из заявки.
 * @param manifest Манифест модуля.
 */
function createSubmission(
  systemIds: Array<string>,
  manifest: string,
): ModuleSubmission {
  return {
    id: 'submission-1',
    status: 'PENDING',
    authorId: 'author-1',
    authorName: 'author',
    repositoryUrl: 'https://github.com/a/b',
    manifestUrl: 'https://raw.githubusercontent.com/a/b/main/module.json',
    description: 'Описание',
    systemIds,
    module: {
      id: 'map-import',
      name: 'Импорт карт',
      version: '1.0.0',
      author: null,
      icon: null,
      downloadUrl: 'https://github.com/a/b/releases/download/v1/m.zip',
      manifest,
      syncedAt: '2026-10-07T10:00:00Z',
    },
    moderation: null,
    linksLocked: false,
    approvedAt: null,
    createdAt: '2026-10-07T10:00:00Z',
    updatedAt: '2026-10-07T10:00:00Z',
  };
}

describe('значок модуля', () => {
  it('пропускает только разрешённые коллекции', () => {
    expect(getModuleIcon('tabler:map-plus')).toBe('tabler:map-plus');
    expect(getModuleIcon('ttg:telegram')).toBe('ttg:telegram');
    expect(getModuleIcon('heroicons:star')).toBe(DEFAULT_MODULE_ICON);
    expect(getModuleIcon(null)).toBe(DEFAULT_MODULE_ICON);
  });
});

describe('заявка и её статус', () => {
  it('исправить можно только заявку на рассмотрении или отклонённую', () => {
    expect(isSubmissionEditable('PENDING')).toBe(true);
    expect(isSubmissionEditable('REJECTED')).toBe(true);
    expect(isSubmissionEditable('APPROVED')).toBe(false);
    expect(isSubmissionEditable('WITHDRAWN')).toBe(false);
  });

  it('страница очереди читается в формате VIA_DTO', () => {
    const page = parseSubmissionsPage({
      content: [createSubmission([], '{}')],
      page: { size: 20, number: 0, totalElements: 41, totalPages: 3 },
    });

    expect(page.totalElements).toBe(41);
    expect(page.content).toHaveLength(1);
  });
});

describe('закрытые заявки', () => {
  it('отозванная и заменённая заявки закрыты', () => {
    expect(isSubmissionClosed('WITHDRAWN')).toBe(true);
    expect(isSubmissionClosed('SUPERSEDED')).toBe(true);
    expect(isSubmissionClosed('APPROVED')).toBe(false);
    expect(isSubmissionClosed('REJECTED')).toBe(false);
  });
});

describe('решения модератора по статусу', () => {
  it('одобрить можно только заявку на рассмотрении', () => {
    expect(canApproveSubmission('PENDING')).toBe(true);
    expect(canApproveSubmission('APPROVED')).toBe(false);
    expect(canApproveSubmission('REJECTED')).toBe(false);
  });

  it('отклонить можно заявку на рассмотрении, одобренную — снять', () => {
    expect(canRejectSubmission('PENDING')).toBe(true);
    expect(canRejectSubmission('APPROVED')).toBe(true);
    expect(canRejectSubmission('WITHDRAWN')).toBe(false);
    expect(canRejectSubmission('SUPERSEDED')).toBe(false);
    expect(isSubmissionInCatalog('APPROVED')).toBe(true);
    expect(isSubmissionInCatalog('PENDING')).toBe(false);
  });
});

describe('подписи заявки', () => {
  it('ссылки ведут в репозиторий, на манифест и на архив', () => {
    const submission = createSubmission([], '{}');

    expect(getSubmissionLinks(submission).map((link) => link.to)).toEqual([
      submission.repositoryUrl,
      submission.manifestUrl,
      submission.module.downloadUrl,
    ]);
  });

  it('модуль подписан идентификатором с версией, автор — именем', () => {
    const submission = createSubmission([], '{}');

    expect(getModuleVersionLabel(submission)).toBe('map-import v1.0.0');
    expect(getSubmissionAuthorLabel(submission)).toBe('Автор: author');

    expect(getSubmissionAuthorLabel({ ...submission, authorName: null })).toBe(
      'Автор: author-1',
    );
  });
});
