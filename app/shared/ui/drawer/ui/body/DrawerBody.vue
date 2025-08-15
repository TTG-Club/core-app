<script setup lang="ts">
  import { UiResult } from '~ui/result';

  defineProps<{
    isLoading?: boolean;
    isError?: boolean;
  }>();
</script>

<template>
  <template v-if="isLoading">
    <USkeleton
      v-for="index in 3"
      :key="index"
      :class="`w-1/${index + 1} h-6`"
    />
  </template>

  <UiResult
    v-else-if="isError"
    title="Неизвестная ошибка"
    status="error"
  />

  <slot
    v-else
    name="default"
  />
</template>
