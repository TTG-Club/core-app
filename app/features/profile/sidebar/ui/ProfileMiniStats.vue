<script setup lang="ts">
  import { useMyBugsCount } from '~bug-report/composables';

  const { fixedBugsCount } = useMyBugsCount();

  /**
   * Мини-статистика профиля (заблюренные placeholder-данные)
   */
  const MINI_STATS = [
    { value: 12, label: 'Уровень' },
    { value: 4, label: 'Персонажа' },
  ] as const;
</script>

<template>
  <div
    class="bg-surface/50 grid w-full grid-cols-3 gap-px overflow-hidden rounded-xl border border-default backdrop-blur-md"
  >
    <!-- Статистика исправленных багов -->
    <div
      class="flex cursor-default flex-col items-center justify-center p-3 text-center transition-colors"
    >
      <UIcon
        name="tabler:bug"
        class="h-5 w-5 text-success"
      />

      <span class="mt-1 text-xl font-bold text-primary">{{
        fixedBugsCount
      }}</span>
    </div>

    <!-- Остальные статистики -->
    <div
      v-for="stat in MINI_STATS"
      :key="stat.label"
      class="cursor-default p-3 text-center transition-colors"
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
