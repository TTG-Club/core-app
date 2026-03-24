<script setup lang="ts">
  import type { UserStatistic } from '../model';

  defineProps<{
    stat: UserStatistic;
  }>();

  const emit = defineEmits<{
    'update:visibility': [key: string, isPublic: boolean];
  }>();

  /**
   * Обработчик изменения видимости
   */
  function handleVisibilityChange(statistic: UserStatistic, value: boolean) {
    emit('update:visibility', statistic.key, value);
  }
</script>

<template>
  <div
    class="hover:border-accent flex items-center justify-between gap-4 rounded-lg border border-muted bg-elevated p-4 transition-colors"
    role="listitem"
  >
    <!-- Иконка и информация -->
    <div class="flex flex-1 items-center gap-3">
      <div
        class="bg-surface flex h-10 w-10 items-center justify-center rounded-lg text-primary"
        aria-hidden="true"
      >
        <UIcon
          :name="stat.icon"
          class="h-5 w-5"
        />
      </div>

      <div class="flex-1">
        <p class="font-medium">
          {{ stat.label }}
        </p>

        <p class="text-sm text-muted">Значение: {{ stat.value }}</p>
      </div>
    </div>

    <!-- Переключатель видимости -->
    <div class="flex items-center gap-2">
      <span
        :id="`stat-${stat.key}-label`"
        class="text-sm text-muted"
      >
        {{ stat.isPublic ? 'Публичная' : 'Приватная' }}
      </span>

      <USwitch
        :model-value="stat.isPublic"
        :aria-labelledby="`stat-${stat.key}-label`"
        @update:model-value="(value) => handleVisibilityChange(stat, value)"
      />
    </div>
  </div>
</template>
