<script setup lang="ts">
  /**
   * Мини-статистика профиля (заблюренные placeholder-данные)
   */
  const MINI_STATS = [
    { value: 12, label: 'Уровень' },
    { value: 4, label: 'Персонажа' },
    { value: 28, label: 'Заметок' },
  ] as const;
</script>

<template>
  <div
    class="bg-surface grid w-full grid-cols-3 gap-px overflow-hidden rounded-xl border border-default"
  >
    <div
      v-for="stat in MINI_STATS"
      :key="stat.label"
      class="cursor-default p-3 transition-colors"
    >
      <div class="opacity-50 blur-md filter select-none">
        <div class="text-xl font-bold text-primary">
          {{ stat.value }}
        </div>

        <div
          class="text-[10px] font-semibold tracking-wider text-muted uppercase"
        >
          {{ stat.label }}
        </div>
      </div>
    </div>
  </div>
</template>
