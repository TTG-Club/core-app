<script setup lang="ts">
  import { DETAIL_PANE_EMPTY_ICON } from './constants';

  defineProps<{
    /** Заголовок, например «Заклинание не выбрано» */
    title: string;
    /** Подсказка, как открыть запись */
    description: string;
  }>();
</script>

<template>
  <div
    class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
  >
    <div class="flex max-w-xs flex-col items-center gap-3">
      <UIcon
        :name="DETAIL_PANE_EMPTY_ICON"
        class="size-10 text-muted"
      />

      <h3 class="text-lg font-semibold text-highlighted">
        {{ title }}
      </h3>

      <p class="text-sm text-secondary">
        {{ description }}
      </p>
    </div>
  </div>
</template>
