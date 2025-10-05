<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      patternId?: string;
    }>(),
    {
      patternId: 'ui-placeholder-pattern',
    },
  );
</script>

<template>
  <svg
    class="absolute inset-0 h-full w-full stroke-inverted/10"
    fill="none"
  >
    <defs>
      <pattern
        :id="props.patternId"
        x="0"
        y="0"
        width="10"
        height="10"
        patternUnits="userSpaceOnUse"
      >
        <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3"></path>
      </pattern>
    </defs>

    <rect
      stroke="none"
      :fill="`url(#${props.patternId})`"
      width="100%"
      height="100%"
    ></rect>
  </svg>
</template>
