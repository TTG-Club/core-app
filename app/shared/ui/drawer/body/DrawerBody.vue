<script setup lang="ts">
  defineProps<{
    isLoading?: boolean;
    isError?: boolean;
  }>();
</script>

<template>
  <ASkeleton
    v-if="isLoading"
    :paragraph="{ rows: 4 }"
    :avatar="false"
    :title="false"
    active
  />

  <AResult
    v-else-if="isError"
    :style="{ minHeight: '100%' }"
    title="Неизвестная ошибка"
    status="error"
  />

  <slot
    v-else
    name="default"
  />
</template>
