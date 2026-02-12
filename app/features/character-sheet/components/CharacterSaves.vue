<script setup lang="ts">
  import type { Character } from '../types';

  defineProps<{
    savingThrows: Character['savingThrows'];
  }>();

  const shortStats: Record<string, string> = {
    str: 'Сил.',
    dex: 'Лов.',
    con: 'Тел.',
    int: 'Инт.',
    wis: 'Мдр.',
    cha: 'Хар.',
  };
</script>

<template>
  <div class="rounded-lg border border-gray-800/50 bg-gray-900/20 p-3">
    <h3 class="mb-3 text-xs font-bold text-gray-500 uppercase">Спас броски</h3>

    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="(save, key) in savingThrows"
        :key="key"
        class="group flex cursor-default items-center justify-between rounded border border-transparent bg-gray-900/30 px-2.5 py-2 transition-colors hover:border-gray-800 hover:bg-gray-800/50"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="h-2.5 w-2.5 rounded-full ring-1 ring-offset-2 ring-offset-gray-900"
            :class="
              save.proficient
                ? 'bg-white ring-gray-400'
                : 'bg-transparent ring-gray-600'
            "
          />

          <span class="text-xs text-gray-400 group-hover:text-gray-300">{{
            shortStats[key] || key
          }}</span>
        </div>

        <span class="text-sm font-bold text-white"
          >{{ save.value >= 0 ? '+' : '' }}{{ save.value }}</span
        >
      </div>
    </div>
  </div>
</template>
