<script setup lang="ts">
  import { parseString } from './renderer';

  const { entries } = defineProps<{
    entries: Array<string>;
  }>();

  const parsed = computed(() => getParsed());

  function getParsed() {
    try {
      return entries.map(parseString);
    } catch (error) {
      console.error(error);

      return [];
    }
  }
</script>

<template>
  <pre
    v-for="(json, index) in parsed"
    :key="index"
  >
     {{ json }}
    </pre
  >
</template>
