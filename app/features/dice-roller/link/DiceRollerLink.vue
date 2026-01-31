<script setup lang="ts">
  import { useDiceRollHandler } from '../composables';

  const props = defineProps<{
    notation: string;
  }>();

  const { handleRoll } = useDiceRollHandler();

  /**
   * Обрабатывает клик по роллеру.
   */
  function onRollClick() {
    handleRoll(props.notation);
  }
</script>

<template>
  <span
    class="cursor-pointer whitespace-nowrap text-link underline decoration-dotted underline-offset-2 hover:text-link hover:decoration-solid"
    @click.left.exact.prevent="onRollClick"
  >
    <slot>{{ notation }}</slot>
  </span>
</template>
