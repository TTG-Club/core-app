<script setup lang="ts">
  interface Props {
    value: number;
    size?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 44,
  });
</script>

<template>
  <div
    class="bg-surface flex items-center justify-center rounded border border-default shadow-sm"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
  >
    <svg
      viewBox="0 0 100 100"
      class="h-full w-full fill-current p-1"
    >
      <circle
        v-if="value % 2 === 1"
        cx="50"
        cy="50"
        r="10"
      />

      <circle
        v-if="value > 1"
        cx="25"
        cy="25"
        r="10"
      />

      <circle
        v-if="value > 1"
        cx="75"
        cy="75"
        r="10"
      />

      <circle
        v-if="value > 3"
        cx="75"
        cy="25"
        r="10"
      />

      <circle
        v-if="value > 3"
        cx="25"
        cy="75"
        r="10"
      />

      <circle
        v-if="value === 6"
        cx="25"
        cy="50"
        r="10"
      />

      <circle
        v-if="value === 6"
        cx="75"
        cy="50"
        r="10"
      />
    </svg>
  </div>
</template>
