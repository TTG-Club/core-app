<script setup lang="ts">
  import SheetPanel from './SheetPanel.vue';

  const {
    label,
    interactive = false,
    unit = undefined,
    pressLabel = undefined,
  } = defineProps<{
    label: string;
    value: string | number;
    unit?: string;

    /** Плитка кликабельна: клик отправляет событие `press`. */
    interactive?: boolean;

    /** Подпись действия для скринридера; по умолчанию — бросок. */
    pressLabel?: string;
  }>();

  const emit = defineEmits<{
    press: [];
  }>();

  const pressAriaLabel = computed(() => pressLabel ?? `Бросок: ${label}`);
</script>

<template>
  <SheetPanel
    :title="label"
    center-title
    :interactive="interactive"
  >
    <button
      v-if="interactive"
      type="button"
      class="flex w-full cursor-pointer items-center justify-center pt-1 after:absolute after:inset-0 after:cursor-pointer"
      :aria-label="pressAriaLabel"
      @click.left.exact.prevent="emit('press')"
    >
      <span class="text-2xl leading-none font-bold text-highlighted">
        {{ value }}

        <span
          v-if="unit"
          class="text-xs font-normal text-dimmed"
        >
          {{ unit }}
        </span>
      </span>
    </button>

    <div
      v-else
      class="flex items-center justify-center pt-1"
    >
      <span class="text-2xl leading-none font-bold text-highlighted">
        {{ value }}

        <span
          v-if="unit"
          class="text-xs font-normal text-dimmed"
        >
          {{ unit }}
        </span>
      </span>
    </div>
  </SheetPanel>
</template>
