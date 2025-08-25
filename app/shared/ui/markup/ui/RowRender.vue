<script setup lang="ts">
  import { render } from '~ui/markup/renderer';
  import type { RenderNode } from '~ui/markup/types';

  const { entry } = defineProps<{
    entry: string | RenderNode;
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
