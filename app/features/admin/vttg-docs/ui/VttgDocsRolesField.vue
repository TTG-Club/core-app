<script setup lang="ts">
  import { MAINTENANCE_ADMIN_ROLE_LABELS } from '~admin/maintenance/model';

  import {
    addVttgDocsCustomRole,
    VTTG_DOCS_ADMIN_ROLES_HINT,
    VTTG_DOCS_ADMIN_ROLES_PLACEHOLDER,
  } from '../model';

  /** Выбор ролей, которым виден канал документации. */
  const { name, label } = defineProps<{
    /** Поле формы — для сообщений проверки. */
    name: string;
    label: string;
  }>();

  const selectedRoles = defineModel<string[]>({ required: true });

  /**
   * Роли для выбора: известные сайту — с подписями (те же, что в режиме
   * обновления), вписанные вручную — под своим именем.
   */
  const roleItems = computed(() => {
    const knownItems = Object.entries(MAINTENANCE_ADMIN_ROLE_LABELS).map(
      ([value, roleLabel]) => ({ value, label: roleLabel }),
    );

    const customItems = selectedRoles.value
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
    selectedRoles.value = addVttgDocsCustomRole(selectedRoles.value, typedRole);
  }
</script>

<template>
  <UFormField
    :name
    :label
    :help="VTTG_DOCS_ADMIN_ROLES_HINT"
  >
    <USelectMenu
      v-model="selectedRoles"
      class="w-full"
      :items="roleItems"
      value-key="value"
      multiple
      create-item
      :placeholder="VTTG_DOCS_ADMIN_ROLES_PLACEHOLDER"
      @create="addCustomRole"
    />
  </UFormField>
</template>
