import { describe, expect, it } from 'vitest';

import { VTTG_DOCS_DEV_ROLES_MAX_COUNT } from '#shared/consts';
import {
  addVttgDocsCustomRole,
  describeVttgDocsSettingsUpdate,
} from '~admin/vttg-docs/model';

const SELECTED_ROLES = ['MODERATOR'];

describe('роль, вписанная вручную в настройку документации VTTG', () => {
  it('приводится к виду из токена и добавляется в конец', () => {
    expect(addVttgDocsCustomRole(SELECTED_ROLES, '  tester ')).toEqual([
      'MODERATOR',
      'TESTER',
    ]);
  });

  it('повтор и имя с чужими символами список не меняют', () => {
    expect(addVttgDocsCustomRole(SELECTED_ROLES, 'moderator')).toBe(
      SELECTED_ROLES,
    );

    expect(addVttgDocsCustomRole(SELECTED_ROLES, 'тестер')).toBe(
      SELECTED_ROLES,
    );
  });

  it('сверх предела роль не добавляется', () => {
    const fullRoles = Array.from(
      { length: VTTG_DOCS_DEV_ROLES_MAX_COUNT },
      (_, roleNumber) => `ROLE_${roleNumber}`,
    );

    expect(addVttgDocsCustomRole(fullRoles, 'TESTER')).toBe(fullRoles);
  });
});

describe('строка о сохранении настройки документации VTTG', () => {
  it('без даты — настройку ещё не сохраняли', () => {
    expect(describeVttgDocsSettingsUpdate({ updatedBy: null }, undefined)).toBe(
      'Ещё не сохранялась',
    );
  });

  it('с датой и автором', () => {
    expect(
      describeVttgDocsSettingsUpdate(
        { updatedBy: 'admin' },
        '19.11.2026 14:05',
      ),
    ).toBe('Сохранено 19.11.2026 14:05 · admin');
  });
});
