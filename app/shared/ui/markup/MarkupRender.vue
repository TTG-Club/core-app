<script setup lang="ts">
  import { render } from './renderer';
  import type { MarkerNode } from './types';

  const { entries } = defineProps<{
    entries: Array<string | MarkerNode>;
  }>();

  const rendered = ref(getRendered());

  function getRendered() {
    try {
      return render(entries);
    } catch (error) {
      console.error(error);

      return [];
    }
  }
</script>

<template>
  <div :class="$style.markup">
    <component
      :is="entry"
      v-for="(entry, index) in rendered"
      :key="index"
    />
  </div>
</template>

<style module lang="scss">
  .markup {
    :global {
      p {
        margin-bottom: 0.5em;
      }
    }
  }
</style>
