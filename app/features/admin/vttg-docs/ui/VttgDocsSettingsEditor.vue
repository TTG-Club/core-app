<script setup lang="ts">
  import type { AlertProps } from '@nuxt/ui';

  import { vttgDocsSettingsUpdateSchema } from '#shared/utils';
  import { MAINTENANCE_ADMIN_ROLE_LABELS } from '~admin/maintenance/model';

  import { useVttgDocsSettingsEditor } from '../composables';
  import {
    addVttgDocsCustomRole,
    describeVttgDocsSettingsUpdate,
    VTTG_DOCS_ADMIN_DATE_FORMAT,
    VTTG_DOCS_ADMIN_LOAD_ERROR_ICON,
    VTTG_DOCS_ADMIN_LOAD_ERROR_TITLE,
    VTTG_DOCS_ADMIN_RETRY_LABEL,
    VTTG_DOCS_ADMIN_ROLES_HINT,
    VTTG_DOCS_ADMIN_ROLES_LABEL,
    VTTG_DOCS_ADMIN_ROLES_PLACEHOLDER,
    VTTG_DOCS_ADMIN_SAVE_ICON,
    VTTG_DOCS_ADMIN_SAVE_LABEL,
  } from '../model';

  /** Форма: каким ролям виден канал разработки документации VTTG. */
  const { format } = useDayjs();

  const {
    savedSettings,
    loadError,
    settingsForm,
    isDirty,
    isSaving,
    save,
    refresh,
  } = useVttgDocsSettingsEditor();

  const loadErrorActions: AlertProps['actions'] = [
    {
      label: VTTG_DOCS_ADMIN_RETRY_LABEL,
      color: 'error',
      variant: 'outline',
      onClick: () => refresh(),
    },
  ];

  /**
   * Роли для выбора: известные сайту — с подписями (те же, что в режиме
   * обновления), вписанные вручную — под своим именем.
   */
  const roleItems = computed(() => {
    const knownItems = Object.entries(MAINTENANCE_ADMIN_ROLE_LABELS).map(
      ([value, label]) => ({ value, label }),
    );

    const customItems = settingsForm.value.devChannelRoles
      .filter(
        (role) => !knownItems.some((knownItem) => knownItem.value === role),
      )
      .map((role) => ({ value: role, label: role }));

    return [...knownItems, ...customItems];
  });

  /**
   * Добавляет вписанную вручную роль: имя приводится к виду из токена, чужие
   * символы и повторы не принимаются.
   *
   * @param typedRole что вписал администратор
   */
  function addCustomRole(typedRole: string): void {
    settingsForm.value.devChannelRoles = addVttgDocsCustomRole(
      settingsForm.value.devChannelRoles,
      typedRole,
    );
  }

  const updatedText = computed(() => {
    if (!savedSettings.value) {
      return undefined;
    }

    const { updatedAt } = savedSettings.value;

    return describeVttgDocsSettingsUpdate(
      savedSettings.value,
      updatedAt ? format(updatedAt, VTTG_DOCS_ADMIN_DATE_FORMAT) : undefined,
    );
  });

  const isSettingsLoading = computed(() => !savedSettings.value);

  const isSaveDisabled = computed(() => !isDirty.value);
</script>

<template>
  <UAlert
    v-if="loadError"
    color="error"
    variant="subtle"
    :icon="VTTG_DOCS_ADMIN_LOAD_ERROR_ICON"
    :title="VTTG_DOCS_ADMIN_LOAD_ERROR_TITLE"
    :actions="loadErrorActions"
  />

  <USkeleton
    v-else-if="isSettingsLoading"
    class="h-48 w-full"
  />

  <UCard
    v-else
    variant="subtle"
  >
    <template #header>
      <span class="text-sm text-muted">{{ updatedText }}</span>
    </template>

    <UForm
      class="flex flex-col gap-5"
      :schema="vttgDocsSettingsUpdateSchema"
      :state="settingsForm"
      @submit="save"
    >
      <UFormField
        name="devChannelRoles"
        :label="VTTG_DOCS_ADMIN_ROLES_LABEL"
        :help="VTTG_DOCS_ADMIN_ROLES_HINT"
      >
        <USelectMenu
          v-model="settingsForm.devChannelRoles"
          class="w-full"
          :items="roleItems"
          value-key="value"
          multiple
          create-item
          :placeholder="VTTG_DOCS_ADMIN_ROLES_PLACEHOLDER"
          @create="addCustomRole"
        />
      </UFormField>

      <div class="flex justify-end">
        <UButton
          type="submit"
          :icon="VTTG_DOCS_ADMIN_SAVE_ICON"
          :label="VTTG_DOCS_ADMIN_SAVE_LABEL"
          :loading="isSaving"
          :disabled="isSaveDisabled"
        />
      </div>
    </UForm>
  </UCard>
</template>
