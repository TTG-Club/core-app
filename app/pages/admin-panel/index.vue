<script setup lang="ts">
  useSeoMeta({
    title: 'Админ-панель',
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Админ-панель"
  >
    <div
      class="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:[grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]"
    >
      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="truncate text-base text-highlighted">Токенатор</h2>

            <UButton
              size="sm"
              to="/admin-panel/tokenator"
            >
              Настроить
            </UButton>
          </div>
        </template>

        <div class="text-sm text-neutral-500">
          Управление рамками и настройками токенатора
        </div>
      </UCard>
    </div>
  </NuxtLayout>
</template>
