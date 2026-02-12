<script setup lang="ts">
  import type { Character } from '../types';

  defineProps<{
    character: Character;
  }>();
</script>

<template>
  <div class="flex items-center gap-6">
    <!-- Avatar with Gold Ring -->
    <div class="relative shrink-0">
      <div
        class="h-24 w-24 rounded-full border-2 border-amber-500/80 p-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
      >
        <img
          src="https://placehold.co/400"
          alt="Avatar"
          class="h-full w-full rounded-full bg-gray-800 object-cover"
        />
      </div>
    </div>

    <!-- Info -->
    <div class="flex grow flex-col gap-1">
      <h1 class="font-serif text-3xl tracking-wide text-gray-100">
        {{ character.name }}
      </h1>

      <div
        class="text-sm font-medium tracking-wider text-amber-500/80 uppercase"
      >
        {{ character.race }} - {{ character.class }}
      </div>

      <!-- XP Bar -->
      <div class="relative mt-2 max-w-lg">
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <span class="shrink-0 whitespace-nowrap"
            >Уровень {{ character.level }}</span
          >

          <UProgress
            :model-value="(character.xp.current / character.xp.max) * 100"
            :max="100"
            size="sm"
            color="warning"
            :animation="undefined"
            class="grow"
          />

          <span class="shrink-0 whitespace-nowrap"
            >Уровень {{ character.level + 1 }}</span
          >
        </div>

        <!-- XP text below (absolute positioned) -->
        <div
          class="pointer-events-none absolute top-full left-0 mt-1 w-full text-center text-[10px] text-gray-500"
        >
          {{ character.xp.current }} / {{ character.xp.max }} XP
        </div>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex gap-2 self-start">
      <UButton
        icon="i-fluent-lock-closed-16-regular"
        color="neutral"
        variant="ghost"
        class="text-gray-400 hover:text-white"
      />

      <UButton
        icon="i-fluent-dismiss-16-regular"
        color="neutral"
        variant="ghost"
        class="text-gray-400 hover:text-white"
      />
    </div>
  </div>
</template>
