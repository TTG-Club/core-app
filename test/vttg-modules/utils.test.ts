import type { ModuleSubmission } from '~vttg-modules/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MODULE_ICON,
  getManifestSystemIds,
  getModuleIcon,
  hasSystemsMismatch,
  isSubmissionEditable,
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
    createdAt: '2026-10-07T10:00:00Z',
    updatedAt: '2026-10-07T10:00:00Z',
  };
}

describe('системы модуля из манифеста', () => {
  it('нет поля, пустой список и «*» — любая система', () => {
    expect(getManifestSystemIds('{}')).toEqual([]);
    expect(getManifestSystemIds('{"compatibleSystems": []}')).toEqual([]);
    expect(getManifestSystemIds('{"compatibleSystems": ["*"]}')).toEqual([]);
  });

  it('битый манифест не роняет карточку модератора', () => {
    expect(getManifestSystemIds('<html>')).toEqual([]);
    expect(getManifestSystemIds('{"compatibleSystems": "dnd5e"}')).toEqual([]);
  });

  it('системы заявки совпадают с манифестом без учёта порядка', () => {
    const submission = createSubmission(
      ['pf2e', 'dnd5e-2024'],
      '{"compatibleSystems": ["dnd5e-2024", "pf2e"]}',
    );

    expect(hasSystemsMismatch(submission)).toBe(false);
  });

  it('расхождение заметно модератору', () => {
    expect(
      hasSystemsMismatch(
        createSubmission(['dnd5e-2024'], '{"compatibleSystems": ["*"]}'),
      ),
    ).toBe(true);

    expect(
      hasSystemsMismatch(
        createSubmission([], '{"compatibleSystems": ["dnd5e-2024"]}'),
      ),
    ).toBe(true);
  });
});

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
