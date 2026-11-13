<script setup lang="ts">
  import type { AlertProps } from '@nuxt/ui';

  import type { MaintenanceAdminSiteTab } from '../model';

  import {
    MAINTENANCE_ALLOWED_ROLES_MAX_COUNT,
    MAINTENANCE_MESSAGE_MAX_LENGTH,
    MAINTENANCE_ROLE_MAX_LENGTH,
    MAINTENANCE_ROLE_PATTERN,
    MAINTENANCE_TITLE_MAX_LENGTH,
  } from '#shared/consts';
  import { maintenanceSettingsUpdateSchema } from '#shared/utils';

  import { useMaintenanceEditor } from '../composables';
  import {
    MAINTENANCE_ADMIN_DATE_FORMAT,
    MAINTENANCE_ADMIN_LOAD_ERROR_ICON,
    MAINTENANCE_ADMIN_LOAD_ERROR_TITLE,
    MAINTENANCE_ADMIN_MESSAGE_HINT,
    MAINTENANCE_ADMIN_MESSAGE_LABEL,
    MAINTENANCE_ADMIN_MESSAGE_ROWS,
    MAINTENANCE_ADMIN_NEVER_SAVED_LABEL,
    MAINTENANCE_ADMIN_RETRY_LABEL,
    MAINTENANCE_ADMIN_ROLE_LABELS,
    MAINTENANCE_ADMIN_ROLES_HINT,
    MAINTENANCE_ADMIN_ROLES_LABEL,
    MAINTENANCE_ADMIN_ROLES_PLACEHOLDER,
    MAINTENANCE_ADMIN_SAVE_ICON,
    MAINTENANCE_ADMIN_SAVE_LABEL,
    MAINTENANCE_ADMIN_STATE_BADGES,
    MAINTENANCE_ADMIN_SWITCH_LABEL,
    MAINTENANCE_ADMIN_TITLE_LABEL,
    MAINTENANCE_ADMIN_UPDATED_LABEL,
    MAINTENANCE_ADMIN_UPDATED_SEPARATOR,
  } from '../model';

  /** Форма режима «сайт закрыт на обновление» одного сайта. */
  const { site } = defineProps<{
    site: MaintenanceAdminSiteTab;
  }>();

  const { format } = useDayjs();

  const { savedSettings, loadError, form, isDirty, isSaving, save, refresh } =
    useMaintenanceEditor(site.value);

  const loadErrorActions: AlertProps['actions'] = [
    {
      label: MAINTENANCE_ADMIN_RETRY_LABEL,
      color: 'error',
      variant: 'outline',
      onClick: () => refresh(),
    },
  ];

  /**
   * Роли для выбора: известные сайту — с подписями, а вписанные вручную (роль
   * из core-api, о которой сайт ещё не знает) — под своим именем.
   */
  const roleItems = computed(() => {
    const knownItems = Object.entries(MAINTENANCE_ADMIN_ROLE_LABELS).map(
      ([value, label]) => ({ value, label }),
    );

    const customItems = form.value.allowedRoles
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
   * @param input что вписал администратор
   */
  function addCustomRole(input: string): void {
    const role = input.trim().toUpperCase();

    if (
      role.length > MAINTENANCE_ROLE_MAX_LENGTH
      || !MAINTENANCE_ROLE_PATTERN.test(role)
      || form.value.allowedRoles.includes(role)
      || form.value.allowedRoles.length >= MAINTENANCE_ALLOWED_ROLES_MAX_COUNT
    ) {
      return;
    }

    form.value.allowedRoles = [...form.value.allowedRoles, role];
  }

  const stateBadge = computed(() =>
    savedSettings.value?.enabled
      ? MAINTENANCE_ADMIN_STATE_BADGES.closed
      : MAINTENANCE_ADMIN_STATE_BADGES.open,
  );

  const updatedText = computed(() => {
    const { updatedAt, updatedBy } = savedSettings.value ?? {};

    if (!updatedAt) {
      return MAINTENANCE_ADMIN_NEVER_SAVED_LABEL;
    }

    const date = `${MAINTENANCE_ADMIN_UPDATED_LABEL} ${format(updatedAt, MAINTENANCE_ADMIN_DATE_FORMAT)}`;

    return updatedBy
      ? `${date}${MAINTENANCE_ADMIN_UPDATED_SEPARATOR}${updatedBy}`
      : date;
  });
</script>

<template>
  <UAlert
    v-if="loadError"
    color="error"
    variant="subtle"
    :icon="MAINTENANCE_ADMIN_LOAD_ERROR_ICON"
    :title="MAINTENANCE_ADMIN_LOAD_ERROR_TITLE"
    :actions="loadErrorActions"
  />

  <USkeleton
    v-else-if="!savedSettings"
    class="h-96 w-full"
  />

  <UCard
    v-else
    variant="subtle"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <UBadge
          :color="stateBadge.color"
          variant="subtle"
          :label="stateBadge.label"
        />

        <span class="text-sm text-muted">
          {{ updatedText }}
        </span>
      </div>
    </template>

    <UForm
      class="flex flex-col gap-5"
      :schema="maintenanceSettingsUpdateSchema"
      :state="form"
      @submit="save"
    >
      <USwitch
        v-model="form.enabled"
        :label="MAINTENANCE_ADMIN_SWITCH_LABEL"
        :description="site.switchDescription"
      />

      <UFormField
        name="allowedRoles"
        :label="MAINTENANCE_ADMIN_ROLES_LABEL"
        :help="MAINTENANCE_ADMIN_ROLES_HINT"
      >
        <USelectMenu
          v-model="form.allowedRoles"
          class="w-full"
          :items="roleItems"
          value-key="value"
          multiple
          create-item
          :placeholder="MAINTENANCE_ADMIN_ROLES_PLACEHOLDER"
          @create="addCustomRole"
        />
      </UFormField>

      <UFormField
        name="title"
        :label="MAINTENANCE_ADMIN_TITLE_LABEL"
        required
      >
        <UInput
          v-model="form.title"
          class="w-full"
          :maxlength="MAINTENANCE_TITLE_MAX_LENGTH"
        />
      </UFormField>

      <UFormField
        name="message"
        :label="MAINTENANCE_ADMIN_MESSAGE_LABEL"
        :help="MAINTENANCE_ADMIN_MESSAGE_HINT"
        required
      >
        <UTextarea
          v-model="form.message"
          class="w-full"
          autoresize
          :rows="MAINTENANCE_ADMIN_MESSAGE_ROWS"
          :maxlength="MAINTENANCE_MESSAGE_MAX_LENGTH"
        />
      </UFormField>

      <div class="flex justify-end">
        <UButton
          type="submit"
          :icon="MAINTENANCE_ADMIN_SAVE_ICON"
          :loading="isSaving"
          :disabled="!isDirty"
        >
          {{ MAINTENANCE_ADMIN_SAVE_LABEL }}
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
