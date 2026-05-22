<script setup lang="ts">
  import type { AlertProps } from '#ui/components/Alert.vue';

  defineProps<{
    /** Мета-данные алерта из route.meta */
    alert?: Pick<AlertProps, 'description' | 'color' | 'title' | 'icon'>;
  }>();
</script>

<template>
  <UAlert
    v-if="alert?.description"
    class="shrink-0"
    variant="soft"
    :color="alert.color || 'info'"
    :icon="alert.icon || undefined"
    :title="alert.title || undefined"
    :description="alert.description"
  />

  <div class="flex-auto">
    <slot name="default" />
  </div>
</template>
