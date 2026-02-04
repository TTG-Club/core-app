<script setup lang="ts">
  import { SelectBackground } from '~ui/select';

  const backgroundUrl = defineModel<string | undefined>('backgroundUrl');
</script>

<template>
  <SelectBackground v-model="backgroundUrl" />
</template>
