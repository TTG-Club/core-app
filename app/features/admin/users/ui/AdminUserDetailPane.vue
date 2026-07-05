<script setup lang="ts">
  import type { AdminRoleResponse, AdminUserResponse } from '../model';

  import { UiDetailPane } from '~ui/detail-pane';

  import AdminUserDetail from './AdminUserDetail.vue';

  defineProps<{
    /** Выбранный пользователь */
    user: AdminUserResponse;
    /** Справочник ролей для селектора */
    roles: AdminRoleResponse[];
  }>();

  const emit = defineEmits<{
    /** Закрытие панели */
    close: [];
    /** Пользователь обновлён (сохранены роли) */
    saved: [user: AdminUserResponse];
  }>();
</script>

<template>
  <UiDetailPane
    :title="user.username"
    @close="emit('close')"
  >
    <AdminUserDetail
      :user="user"
      :roles="roles"
      @saved="(updated) => emit('saved', updated)"
    />
  </UiDetailPane>
</template>
