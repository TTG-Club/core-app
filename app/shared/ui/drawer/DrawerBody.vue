<script setup lang="ts">
  defineProps<{
    isLoading?: boolean;
  }>();
</script>

<template>
  <Transition
    name="fade"
    mode="out-in"
  >
    <slot
      v-if="$slots.body"
      name="body"
    />

    <ASkeleton
      v-else-if="isLoading"
      :paragraph="{
        rows: 4,
      }"
      :avatar="false"
      :title="false"
      active
    />

    <AResult
      v-else
      :style="{ minHeight: '100%' }"
      status="error"
      title="Неизвестная ошибка"
    />
  </Transition>
</template>
