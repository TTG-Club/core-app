<script setup lang="ts">
  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICONS,
    DM_SCREEN_TEXT,
    getScreenWindowIcon,
  } from '../model';

  /**
   * Плашки свёрнутых окон у левого нижнего угла холста: клик по плашке
   * разворачивает окно поверх остальных, крестик убирает его с ширмы.
   */
  const { minimizedWindows, restore, close } = useDmScreen();

  const chips = computed(() =>
    minimizedWindows.value.map((screenWindow) => ({
      id: screenWindow.id,
      title: screenWindow.title,
      icon: getScreenWindowIcon(screenWindow.path),
      restoreLabel: `${DM_SCREEN_TEXT.restore}: ${screenWindow.title}`,
      closeLabel: `${DM_SCREEN_TEXT.close}: ${screenWindow.title}`,
    })),
  );
</script>

<template>
  <div
    v-if="chips.length"
    role="toolbar"
    :aria-label="DM_SCREEN_TEXT.dock"
    class="absolute bottom-2 left-2 flex max-w-[calc(100%-6rem)] flex-wrap gap-1.5"
  >
    <div
      v-for="chip in chips"
      :key="chip.id"
      class="flex items-center rounded-md border border-default bg-elevated shadow-lg"
    >
      <UButton
        :icon="chip.icon"
        :label="chip.title"
        :aria-label="chip.restoreLabel"
        color="neutral"
        variant="ghost"
        size="sm"
        class="max-w-56"
        :ui="{ label: 'truncate', leadingIcon: 'text-primary' }"
        @click.left.exact.prevent="restore(chip.id)"
      />

      <UButton
        :icon="DM_SCREEN_ICONS.close"
        :aria-label="chip.closeLabel"
        color="neutral"
        variant="ghost"
        size="xs"
        @click.left.exact.prevent="close(chip.id)"
      />
    </div>
  </div>
</template>
