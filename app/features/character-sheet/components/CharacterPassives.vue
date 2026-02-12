<script setup lang="ts">
  import type { Character } from '../types';

  defineProps<{
    passiveSenses: Character['passiveSenses'];
  }>();
</script>

<template>
  <div class="rounded-lg border border-gray-800/50 bg-gray-900/20 p-4">
    <h3 class="mb-3 text-xs font-bold text-gray-500 uppercase">
      Пассивные чувства
    </h3>

    <div class="flex flex-col gap-4">
      <div
        class="flex items-center justify-between rounded-lg border border-gray-800/50 bg-gray-900/40 px-4 py-3"
      >
        <div class="flex flex-col">
          <span class="text-xs font-medium text-gray-400">Восприятие</span>

          <span class="text-[10px] text-gray-600 uppercase">МУД</span>
        </div>

        <span class="text-xl font-bold text-white">{{
          passiveSenses.perception
        }}</span>
      </div>

      <div
        class="flex items-center justify-between rounded-lg border border-gray-700/30 bg-gray-800/40 px-4 py-3"
      >
        <div class="flex flex-col">
          <span class="text-xs font-medium text-gray-400"
            >Проницательность</span
          >

          <span class="text-[10px] text-gray-600 uppercase">МУД</span>
        </div>

        <span class="text-xl font-bold text-white">{{
          passiveSenses.insight
        }}</span>
      </div>

      <div
        class="flex items-center justify-between rounded-lg border border-gray-700/30 bg-gray-800/40 px-4 py-3"
      >
        <div class="flex flex-col">
          <span class="text-xs font-medium text-gray-400">Анализ</span>

          <span class="text-[10px] text-gray-600 uppercase">ИНТ</span>
        </div>

        <span class="text-xl font-bold text-white">{{
          passiveSenses.investigation
        }}</span>
      </div>
    </div>
  </div>
</template>
