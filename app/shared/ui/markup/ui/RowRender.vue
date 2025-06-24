<script setup lang="ts">
  import { parse } from '~ui/markup/parser';
  import { render } from '~ui/markup/renderer';

  const { entry } = defineProps<{
    entry: string;
  }>();

  const rendered = ref(getRendered());

  function getRendered() {
    try {
      return render(parse(entry));
    } catch (error) {
      console.error(error);

      return [];
    }
  }
</script>

<template>
  <component
    :is="row"
    v-for="(row, index) in rendered"
    :key="index"
  />
</template>
