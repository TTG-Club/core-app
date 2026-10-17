<script setup lang="ts">
  import { D20_SIDES, DICE_SHAPE_PATHS } from '../model';

  const { sides } = defineProps<{ sides: number }>();

  const shapePath = computed(
    () => DICE_SHAPE_PATHS[sides] ?? DICE_SHAPE_PATHS[D20_SIDES],
  );
</script>

<template>
  <svg
    class="size-4 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="shapePath" />
  </svg>
</template>
