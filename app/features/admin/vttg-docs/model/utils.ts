import type { VttgDocsSettings, VttgDocsSettingsUpdate } from '#shared/types';

import { xor } from 'es-toolkit';

import { VTTG_DOCS_CHANNEL_ROLES_MAX_COUNT } from '#shared/consts';
import { vttgDocsRoleSchema } from '#shared/utils';

import {
  VTTG_DOCS_ADMIN_NEVER_SAVED_LABEL,
  VTTG_DOCS_ADMIN_UPDATED_LABEL,
  VTTG_DOCS_ADMIN_UPDATED_SEPARATOR,
} from './constants';

/**
 * Роли после того, как администратор вписал новую вручную. Имя приводится к
 * виду из токена (заглавными, без пробелов по краям); неподходящее имя, повтор
 * или превышение предела список не меняют.
 *
 * @param selectedRoles уже выбранные роли
 * @param typedRole что вписал администратор
 */
export function addVttgDocsCustomRole(
  selectedRoles: string[],
  typedRole: string,
): string[] {
  const parsedRole = vttgDocsRoleSchema.safeParse(
    typedRole.trim().toUpperCase(),
  );

  if (
    !parsedRole.success
    || selectedRoles.includes(parsedRole.data)
    || selectedRoles.length >= VTTG_DOCS_CHANNEL_ROLES_MAX_COUNT
  ) {
    return selectedRoles;
  }

  return [...selectedRoles, parsedRole.data];
}

/**
 * Строка «Сохранено 19.11.2026 14:05 · admin» над формой.
 *
 * @param savedSettings сохранённая настройка
 * @param formattedUpdatedAt дата сохранения, уже отформатированная
 */
export function describeVttgDocsSettingsUpdate(
  savedSettings: Pick<VttgDocsSettings, 'updatedBy'>,
  formattedUpdatedAt: string | undefined,
): string {
  if (!formattedUpdatedAt) {
    return VTTG_DOCS_ADMIN_NEVER_SAVED_LABEL;
  }

  return [
    `${VTTG_DOCS_ADMIN_UPDATED_LABEL} ${formattedUpdatedAt}`,
    savedSettings.updatedBy,
  ]
    .filter(Boolean)
    .join(VTTG_DOCS_ADMIN_UPDATED_SEPARATOR);
}

/**
 * Форма с копией сохранённой настройки: правки формы не трогают сохранённое.
 *
 * @param savedSettings сохранённая настройка
 */
export function toVttgDocsSettingsForm(
  savedSettings: VttgDocsSettingsUpdate,
): VttgDocsSettingsUpdate {
  return {
    isReleaseChannelPublic: savedSettings.isReleaseChannelPublic,
    releaseChannelRoles: [...savedSettings.releaseChannelRoles],
    devChannelRoles: [...savedSettings.devChannelRoles],
  };
}

/**
 * Форма отличается от сохранённой настройки. Роли сравниваются как наборы:
 * порядок выбора форму изменённой не делает.
 *
 * @param settingsForm форма
 * @param savedSettings сохранённая настройка
 */
export function isVttgDocsSettingsChanged(
  settingsForm: VttgDocsSettingsUpdate,
  savedSettings: VttgDocsSettingsUpdate,
): boolean {
  return (
    settingsForm.isReleaseChannelPublic !== savedSettings.isReleaseChannelPublic
    || xor(settingsForm.releaseChannelRoles, savedSettings.releaseChannelRoles)
      .length > 0
    || xor(settingsForm.devChannelRoles, savedSettings.devChannelRoles).length
      > 0
  );
}
