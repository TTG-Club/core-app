<script setup lang="ts">
  import { ProfileCardUI } from '../model';
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:trophy"
          class="h-5 w-5 text-warning"
          aria-hidden="true"
        />

        <h3 class="font-semibold text-primary">Достижения</h3>
      </div>
    </template>

    <div
      v-if="isDev"
      class="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-default bg-elevated p-8"
    >
      <UEmpty
        icon="tabler:trophy"
        title="Пока нет достижений"
        description="Активно участвуйте в жизни сообщества, чтобы получить награды"
      >
        <template #icon="{ name }">
          <UIcon
            :name="name"
            class="h-12 w-12 text-muted"
            aria-hidden="true"
          />
        </template>
      </UEmpty>
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <UAlert
        icon="tabler:info-circle"
        color="neutral"
        variant="subtle"
        title="Достижения"
        description="Функция будет доступна в будущих обновлениях"
      />
    </div>
  </UCard>
</template>
