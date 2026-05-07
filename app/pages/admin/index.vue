<script setup lang="ts">
  import {
    ADMIN_USERS_CONFIGURE_LABEL,
    ADMIN_USERS_NAVIGATION_LABEL,
    ADMIN_USERS_PAGE_DESCRIPTION,
  } from '~admin/users/model';
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Админ-панель"
  >
    <div
      class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fit,minmax(360px,1fr))]"
    >
      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="truncate text-base text-highlighted">Токенатор</h2>

            <UButton
              size="sm"
              to="/admin/tokenator"
            >
              Настроить
            </UButton>
          </div>
        </template>

        <div class="text-sm text-neutral-500">
          Управление рамками и настройками токенатора
        </div>
      </UCard>

      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="truncate text-base text-highlighted">Персоны</h2>

            <UButton
              size="sm"
              to="/admin/personas"
            >
              Настроить
            </UButton>
          </div>
        </template>

        <div class="text-sm text-neutral-500">
          Управление персонами и их фразами
        </div>
      </UCard>

      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="truncate text-base text-highlighted">
              {{ ADMIN_USERS_NAVIGATION_LABEL }}
            </h2>

            <UButton
              size="sm"
              to="/admin/users"
            >
              {{ ADMIN_USERS_CONFIGURE_LABEL }}
            </UButton>
          </div>
        </template>

        <div class="text-sm text-muted">
          {{ ADMIN_USERS_PAGE_DESCRIPTION }}
        </div>
      </UCard>
    </div>
  </NuxtLayout>
</template>
