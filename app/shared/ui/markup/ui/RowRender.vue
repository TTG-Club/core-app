<script setup lang="ts">
  import { render } from '../renderer';
  import type { Entry } from '../types';

  const { entry } = defineProps<{
    entry: Entry;
  }>();

  const rendered = computed(() => {
    try {
      return render([entry]);
    } catch (e) {
      console.error(e);

      return [];
    }
  });
</script>

<template>
  <component
    :is="row"
    v-for="(row, index) in rendered"
    :key="index"
  />
</template>
