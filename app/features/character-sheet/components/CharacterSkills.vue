<script setup lang="ts">
  import type { Character } from '../types';

  defineProps<{
    skills: Character['skills'];
  }>();

  const shortStats: Record<string, string> = {
    str: 'СИЛ',
    dex: 'ЛОВ',
    con: 'ТЕЛ',
    int: 'ИНТ',
    wis: 'МУД',
    cha: 'ХАР',
  };
</script>

<template>
  <div
    class="flex h-full grow flex-col rounded-lg border border-gray-800/50 bg-gray-900/20 p-3"
  >
    <h3 class="mb-3 px-2 text-xs font-bold text-gray-500 uppercase">Навыки</h3>

    <div class="custom-scrollbar flex flex-col gap-0.5 overflow-y-auto pr-1">
      <div
        v-for="skill in skills"
        :key="skill.name"
        class="group flex cursor-pointer items-center justify-between rounded px-2 py-2 transition-colors hover:bg-gray-800/40"
      >
        <div class="flex items-center gap-3">
          <div class="flex w-4 items-center justify-center">
            <UIcon
              v-if="skill.proficient"
              name="i-ttg-check"
              class="text-xs text-white"
            />

            <div
              v-else
              class="h-1 w-1 rounded-full bg-gray-700"
            />
          </div>

          <span class="w-8 font-mono text-[10px] text-gray-500 uppercase">{{
            shortStats[skill.modifier]
          }}</span>

          <span
            class="text-sm text-gray-400 transition-colors group-hover:text-white"
            >{{ skill.name }}</span
          >
        </div>

        <span
          class="font-mono text-sm font-medium text-gray-500 transition-colors group-hover:text-amber-500"
          >{{ skill.value >= 0 ? '+' : '' }}{{ skill.value }}</span
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background: #374151;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4b5563;
  }
</style>
