<script setup lang="ts">
  import type { AlertProps } from '@nuxt/ui';

  import { vttgDocsSettingsUpdateSchema } from '#shared/utils';

  import { useVttgDocsSettingsEditor } from '../composables';
  import {
    describeVttgDocsSettingsUpdate,
    VTTG_DOCS_ADMIN_DATE_FORMAT,
    VTTG_DOCS_ADMIN_DEV_ROLES_LABEL,
    VTTG_DOCS_ADMIN_LOAD_ERROR_ICON,
    VTTG_DOCS_ADMIN_LOAD_ERROR_TITLE,
    VTTG_DOCS_ADMIN_RELEASE_PUBLIC_HINT,
    VTTG_DOCS_ADMIN_RELEASE_PUBLIC_LABEL,
    VTTG_DOCS_ADMIN_RELEASE_ROLES_LABEL,
    VTTG_DOCS_ADMIN_RETRY_LABEL,
    VTTG_DOCS_ADMIN_SAVE_ICON,
    VTTG_DOCS_ADMIN_SAVE_LABEL,
  } from '../model';
  import VttgDocsRolesField from './VttgDocsRolesField.vue';

  /** Форма: кому виден релизный канал документации VTTG и кому — dev. */
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

  /** Роли релиза нужны, только когда он открыт не всем. */
  const isReleaseRolesShown = computed(
    () => !settingsForm.value.isReleaseChannelPublic,
  );
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
      <UFormField name="isReleaseChannelPublic">
        <USwitch
          v-model="settingsForm.isReleaseChannelPublic"
          :label="VTTG_DOCS_ADMIN_RELEASE_PUBLIC_LABEL"
          :description="VTTG_DOCS_ADMIN_RELEASE_PUBLIC_HINT"
        />
      </UFormField>

      <VttgDocsRolesField
        v-if="isReleaseRolesShown"
        v-model="settingsForm.releaseChannelRoles"
        name="releaseChannelRoles"
        :label="VTTG_DOCS_ADMIN_RELEASE_ROLES_LABEL"
      />

      <VttgDocsRolesField
        v-model="settingsForm.devChannelRoles"
        name="devChannelRoles"
        :label="VTTG_DOCS_ADMIN_DEV_ROLES_LABEL"
      />

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
