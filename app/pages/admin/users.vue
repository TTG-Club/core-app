<script setup lang="ts">
  import type {
    AdminRoleResponse,
    AdminUserResponse,
  } from '~admin/users/model';

  import {
    ADMIN_USERS_EMPTY_TEXT,
    ADMIN_USERS_PAGE_DESCRIPTION,
    ADMIN_USERS_PAGE_TITLE,
    ADMIN_USERS_SEARCH_DEBOUNCE,
    ADMIN_USERS_SEARCH_PLACEHOLDER,
  } from '~admin/users/model';
  import { AdminUserCard } from '~admin/users/ui';

  useSeoMeta({
    title: ADMIN_USERS_PAGE_TITLE,
  });

  const requestFetch = useRequestFetch();
  const search = shallowRef('');
  const searchQuery = refDebounced(search, ADMIN_USERS_SEARCH_DEBOUNCE);

  const {
    data: users,
    status: usersStatus,
    refresh: refreshUsers,
  } = await useAsyncData<AdminUserResponse[]>(
    'admin-users',
    () => {
      return requestFetch('/api/auth/users', {
        query: {
          query: searchQuery.value || undefined,
        },
      });
    },
    {
      default: () => [],
      watch: [searchQuery],
    },
  );

  const { data: roles } = await useAsyncData<AdminRoleResponse[]>(
    'admin-roles',
    () => requestFetch('/api/auth/roles'),
    { default: () => [] },
  );
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="ADMIN_USERS_PAGE_TITLE"
  >
    <div class="space-y-6">
      <UCard variant="subtle">
        <div
          class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)] lg:items-center"
        >
          <p class="text-sm text-muted">
            {{ ADMIN_USERS_PAGE_DESCRIPTION }}
          </p>

          <UInput
            v-model="search"
            icon="tabler:search"
            :placeholder="ADMIN_USERS_SEARCH_PLACEHOLDER"
            :loading="usersStatus === 'pending'"
          />
        </div>
      </UCard>

      <div class="space-y-4">
        <AdminUserCard
          v-for="user in users"
          :key="user.id"
          :user="user"
          :roles="roles"
          @saved="refreshUsers()"
        />
      </div>

      <div
        v-if="!users.length"
        class="py-8 text-center text-muted"
      >
        {{ ADMIN_USERS_EMPTY_TEXT }}
      </div>
    </div>
  </NuxtLayout>
</template>
