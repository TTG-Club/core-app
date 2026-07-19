<script setup lang="ts">
  import type { CharacterStats } from '../types';

  const props = defineProps<{
    stats: CharacterStats;
  }>();

  const statsList = computed(() => [
    { label: 'Сила', value: props.stats.str },
    { label: 'Ловкость', value: props.stats.dex },
    { label: 'Телосложение', value: props.stats.con },
    { label: 'Интеллект', value: props.stats.int },
    { label: 'Мудрость', value: props.stats.wis },
    { label: 'Харизма', value: props.stats.cha },
  ]);

  function getModifier(value: number) {
    const mod = Math.floor((value - 10) / 2);

    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
</script>

<template>
  <div class="grid grid-cols-3 gap-3 sm:grid-cols-3 xl:grid-cols-6">
    <div
      v-for="stat in statsList"
      :key="stat.label"
      class="group relative flex flex-col items-center overflow-hidden rounded-xl border border-default/50 bg-elevated/30 p-3"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-default/40"
      />

      <span
        class="z-10 mb-1 text-[10px] font-bold tracking-widest text-muted uppercase"
        >{{ stat.label }}</span
      >

      <div class="z-10 font-serif text-3xl font-bold text-highlighted">
        {{ getModifier(stat.value) }}
      </div>

      <div
        class="z-10 mt-1 rounded-full border border-default/50 bg-default/60 px-2 py-0.5 text-xs font-medium text-muted"
      >
        {{ stat.value }}
      </div>
    </div>
  </div>
</template>
