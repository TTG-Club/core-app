<script setup lang="ts">
  import { parse } from './parser';
  import { render } from './renderer';

  const { entries } = defineProps<{
    entries: Array<string>;
  }>();

  const rendered = ref(getRendered());

  function getRendered() {
    try {
      return entries.map((entry) => render(parse(entry)));
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
