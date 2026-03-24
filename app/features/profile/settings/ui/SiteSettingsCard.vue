<script setup lang="ts">
  import { ProfileCardUI } from '../model';
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:settings"
          class="h-5 w-5 text-primary"
          aria-hidden="true"
        />

        <h3 class="font-semibold text-primary">Настройки сайта</h3>
      </div>
    </template>

    <div
      v-if="isDev"
      class="max-w-xl space-y-6"
    >
      <div class="text-sm text-muted">
        Здесь будут настройки фильтров и отображения контента.
      </div>
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <UAlert
        icon="tabler:info-circle"
        color="neutral"
        variant="subtle"
        title="Настройки сайта"
        description="Функция будет доступна в будущих обновлениях"
      />
    </div>
  </UCard>
</template>
