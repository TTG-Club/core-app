<script setup lang="ts">
  import { ProfileCardUI } from '../model';
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:shield-check"
          class="h-5 w-5 text-primary"
          aria-hidden="true"
        />

        <h3 class="font-semibold text-primary">Дополнительная безопасность</h3>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert
        icon="tabler:info-circle"
        color="neutral"
        variant="subtle"
        title="Двухфакторная аутентификация"
        description="Функция будет доступна в будущих обновлениях"
      />
    </div>
  </UCard>
</template>
