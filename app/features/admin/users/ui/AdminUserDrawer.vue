<script setup lang="ts">
  import type { AdminRoleResponse, PageAdminUserResponse } from '../model';

  import { FetchStatus } from '~/shared/consts';
  import { UiDetailPane } from '~ui/detail-pane';

  import {
    ADMIN_ROLES_API_PATH,
    ADMIN_ROLES_DATA_KEY,
    ADMIN_USERS_API_PATH,
    ADMIN_USERS_DRAWER_DATA_KEY_PREFIX,
    ADMIN_USERS_DRAWER_NOT_FOUND_TEXT,
    ADMIN_USERS_DRAWER_SEARCH_SIZE,
    ADMIN_USERS_LOAD_ERROR_TEXT,
  } from '../model';
  import AdminUserDetailPane from './AdminUserDetailPane.vue';

  /**
   * Профиль пользователя в дровере для страниц, где о пользователе известен
   * только логин (статистика подписок и покупок). Тот же профиль, что на
   * странице «Пользователи», но без перехода на неё.
   */
  const { username } = defineProps<{
    /** Логин пользователя: auth-service ищет по нему, точное совпадение берём из выдачи. */
    username: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const requestFetch = useRequestFetch();

  const {
    data: usersPage,
    error: userError,
    status: userStatus,
  } = useAsyncData<PageAdminUserResponse>(
    () => `${ADMIN_USERS_DRAWER_DATA_KEY_PREFIX}-${username}`,
    () =>
      requestFetch(ADMIN_USERS_API_PATH, {
        query: { query: username, size: ADMIN_USERS_DRAWER_SEARCH_SIZE },
      }),
    { watch: [() => username], server: false, deep: false },
  );

  const { data: roles } = useAsyncData<AdminRoleResponse[]>(
    ADMIN_ROLES_DATA_KEY,
    () => requestFetch(ADMIN_ROLES_API_PATH),
    { default: () => [], server: false },
  );

  // Поиск auth-service нечёткий: «Peterko» найдёт и «Peterko2», поэтому сверяем логин.
  const user = computed(
    () =>
      usersPage.value?.content.find(
        (candidate) =>
          candidate.username.toLowerCase() === username.toLowerCase(),
      ) ?? null,
  );

  const isLoading = computed(
    () =>
      userStatus.value !== FetchStatus.Success
      && userStatus.value !== FetchStatus.Error,
  );

  const messageText = computed(() =>
    userError.value
      ? ADMIN_USERS_LOAD_ERROR_TEXT
      : ADMIN_USERS_DRAWER_NOT_FOUND_TEXT,
  );
</script>

<template>
  <USlideover
    :close="false"
    :ui="{ content: 'w-full max-w-2xl' }"
  >
    <template #content>
      <AdminUserDetailPane
        v-if="user"
        :key="user.id"
        :user="user"
        :roles="roles"
        @close="emit('close')"
      />

      <UiDetailPane
        v-else
        :title="username"
        :is-loading="isLoading"
        @close="emit('close')"
      >
        <p
          v-if="!isLoading"
          class="text-sm text-muted"
          role="status"
        >
          {{ messageText }}
        </p>
      </UiDetailPane>
    </template>
  </USlideover>
</template>
