<script setup lang="ts">
  import type { CharacterParams } from '../types';

  defineProps<{
    params: CharacterParams;
  }>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Row 1: Speed & Initiative -->
    <div class="grid grid-cols-2 gap-4">
      <div
        class="flex flex-col items-center justify-center rounded-lg border border-gray-800/50 bg-primary/10 p-3"
      >
        <span class="text-[10px] text-gray-500 uppercase">Скорость</span>

        <span class="mt-1 text-2xl leading-none font-bold text-gray-200"
          >{{ params.speed }}
          <span class="text-xs font-normal text-gray-600">Ft.</span></span
        >
      </div>

      <div
        class="flex flex-col items-center justify-center rounded-lg border border-gray-800/50 bg-primary/10 p-3"
      >
        <span class="text-[10px] text-gray-500 uppercase">Инициатива</span>

        <span class="mt-1 text-2xl leading-none font-bold text-gray-200"
          >{{ params.initiative > 0 ? '+' : '' }}{{ params.initiative }}</span
        >
      </div>
    </div>

    <!-- Row 2: Proficiency & AC -->
    <div class="grid grid-cols-2 gap-4">
      <div
        class="flex flex-col items-center justify-center rounded-lg border border-gray-800/50 bg-primary/10 p-3"
      >
        <span class="text-[10px] text-gray-500 uppercase">Мастерство</span>

        <span class="mt-1 text-2xl leading-none font-bold text-gray-200"
          >+{{ params.proficiencyBonus }}</span
        >
      </div>

      <div
        class="group flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-800/50 bg-primary/10 p-3"
      >
        <span class="z-10 text-[10px] text-gray-500 uppercase">КД</span>

        <span class="z-10 text-3xl leading-none font-bold text-gray-200">{{
          params.armorClass
        }}</span>
      </div>
    </div>

    <!-- HP Block -->
    <div
      class="relative flex items-center gap-3 overflow-hidden rounded-lg border border-gray-800/50 bg-primary/10 p-3"
    >
      <!-- Decoration -->
      <UIcon
        name="i-ph-heart-fill"
        class="pointer-events-none absolute -bottom-6 -left-6 text-8xl text-red-500/10"
      />

      <div class="z-10 flex shrink-0 flex-col items-center gap-1">
        <UIcon
          name="i-ph-heart-fill"
          class="text-3xl text-gray-500/50"
        />
      </div>

      <div class="z-10 grid grow grid-cols-3 gap-1 text-center">
        <!-- Current HP -->
        <div class="flex flex-col items-start px-2">
          <span class="text-[10px] text-gray-500 uppercase">Сейчас</span>

          <span class="mt-1 text-2xl leading-none font-bold text-white">{{
            params.hp.current
          }}</span>
        </div>

        <!-- Max HP -->
        <div class="flex flex-col items-center px-2">
          <span class="text-[10px] text-gray-500 uppercase">Всего</span>

          <span class="mt-1.5 text-lg leading-none font-medium text-gray-500"
            >/ {{ params.hp.max }}</span
          >
        </div>

        <!-- Temp HP -->
        <div class="flex flex-col items-end px-2">
          <span class="text-[10px] text-gray-500 uppercase">Временное</span>

          <span class="mt-1 text-xl leading-none font-bold text-amber-500">{{
            params.hp.temp
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
