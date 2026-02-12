<script setup lang="ts">
  import type { Character } from '../types';

  defineProps<{
    proficiencies: Character['proficiencies'];
  }>();
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-lg border border-gray-800/50 bg-gray-900/20 p-3"
  >
    <!-- Armor -->
    <div v-if="proficiencies.armor.length">
      <h3 class="mb-2 text-[10px] font-bold text-gray-500 uppercase">Броня</h3>

      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="item in proficiencies.armor"
          :key="item"
          class="cursor-default rounded border border-gray-800 bg-gray-900/40 px-2.5 py-1 text-[11px] text-gray-400 transition-colors hover:bg-gray-800/60"
        >
          {{ item }}
        </span>
      </div>
    </div>

    <!-- Weapons -->
    <div v-if="proficiencies.weapons.length">
      <h3 class="mb-2 text-[10px] font-bold text-gray-500 uppercase">Оружие</h3>

      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="item in proficiencies.weapons"
          :key="item"
          class="cursor-default rounded border border-gray-700/50 bg-gray-800 px-2.5 py-1 text-[11px] text-gray-300 transition-colors hover:bg-gray-700"
        >
          {{ item }}
        </span>
      </div>
    </div>

    <!-- Tools -->
    <div v-if="proficiencies.tools.length">
      <h3 class="mb-2 text-[10px] font-bold text-gray-500 uppercase">
        Инструменты
      </h3>

      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="item in proficiencies.tools"
          :key="item"
          class="cursor-default rounded border border-gray-700/50 bg-gray-800 px-2.5 py-1 text-[11px] text-gray-300 transition-colors hover:bg-gray-700"
        >
          {{ item }}
        </span>
      </div>
    </div>

    <!-- Languages -->
    <div v-if="proficiencies.languages.length">
      <h3 class="mb-2 text-[10px] font-bold text-gray-500 uppercase">Языки</h3>

      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="item in proficiencies.languages"
          :key="item"
          class="cursor-default rounded border border-gray-700/50 bg-gray-800 px-2.5 py-1 text-[11px] text-gray-300 transition-colors hover:bg-gray-700"
        >
          {{ item }}
        </span>
      </div>
    </div>
  </div>
</template>
