import { describe, expect, it } from 'vitest';

import { VTTG_DOCS_CHANNEL_ROLES_MAX_COUNT } from '#shared/consts';
import {
  addVttgDocsCustomRole,
  describeVttgDocsSettingsUpdate,
  isVttgDocsSettingsChanged,
  toVttgDocsSettingsForm,
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
      { length: VTTG_DOCS_CHANNEL_ROLES_MAX_COUNT },
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

describe('изменена ли форма настройки документации VTTG', () => {
  const SAVED_SETTINGS = {
    isReleaseChannelPublic: false,
    releaseChannelRoles: ['USER', 'MODERATOR'],
    devChannelRoles: ['TESTER'],
  };

  it('копия формы не меняет сохранённую настройку', () => {
    const settingsForm = toVttgDocsSettingsForm(SAVED_SETTINGS);

    settingsForm.releaseChannelRoles.push('TESTER');

    expect(SAVED_SETTINGS.releaseChannelRoles).toEqual(['USER', 'MODERATOR']);
  });

  it('порядок ролей форму изменённой не делает', () => {
    expect(
      isVttgDocsSettingsChanged(
        { ...SAVED_SETTINGS, releaseChannelRoles: ['MODERATOR', 'USER'] },
        SAVED_SETTINGS,
      ),
    ).toBe(false);
  });

  it('переключатель «открыт всем» и новая роль делают форму изменённой', () => {
    expect(
      isVttgDocsSettingsChanged(
        { ...SAVED_SETTINGS, isReleaseChannelPublic: true },
        SAVED_SETTINGS,
      ),
    ).toBe(true);

    expect(
      isVttgDocsSettingsChanged(
        { ...SAVED_SETTINGS, devChannelRoles: ['TESTER', 'USER'] },
        SAVED_SETTINGS,
      ),
    ).toBe(true);
  });
});
