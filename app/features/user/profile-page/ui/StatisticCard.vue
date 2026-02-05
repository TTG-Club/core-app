<script setup lang="ts">
  import type { UserStatistic } from '../model';

  interface Props {
    stat: UserStatistic;
  }

  interface Emits {
    (event: 'update:visibility', key: string, isPublic: boolean): void;
  }

  defineProps<Props>();

  const emit = defineEmits<Emits>();

  /**
   * Обработчик изменения видимости
   */
  function handleVisibilityChange(stat: UserStatistic, value: boolean) {
    emit('update:visibility', stat.key, value);
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
