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
        class="h-24 w-24 rounded-full border-2 border-[color-mix(in_oklch,var(--vttg-gold)_80%,transparent)] p-1 shadow-[0_0_15px_color-mix(in_oklch,var(--vttg-gold)_30%,transparent)]"
      >
        <img
          src="https://placehold.co/400"
          alt="Avatar"
          class="h-full w-full rounded-full bg-elevated object-cover"
        />
      </div>
    </div>

    <!-- Info -->
    <div class="flex grow flex-col gap-1">
      <h1 class="font-serif text-3xl tracking-wide text-highlighted">
        {{ character.name }}
      </h1>

      <div
        class="text-sm font-medium tracking-wider text-(--vttg-gold) uppercase"
      >
        {{ character.race }} - {{ character.class }}
      </div>

      <!-- XP Bar -->
      <div class="relative mt-2 max-w-lg">
        <div class="flex items-center gap-3 text-xs text-toned">
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
          class="pointer-events-none absolute top-full left-0 mt-1 w-full text-center text-[10px] text-muted"
        >
          {{ character.xp.current }} / {{ character.xp.max }} XP
        </div>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex gap-2 self-start">
      <UButton
        icon="i-tabler-lock"
        color="neutral"
        variant="ghost"
      />

      <UButton
        icon="i-tabler-x"
        color="neutral"
        variant="ghost"
      />
    </div>
  </div>
</template>
