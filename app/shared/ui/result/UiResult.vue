<script setup lang="ts">
  import { computed } from 'vue';

  import type { NuxtError } from '#app';

  interface Props {
    status?: 'success' | 'error' | 'info' | 'warning' | '404' | '403';
    error?: NuxtError;
    title?: string;
    subTitle?: string;
    icon?: string;
  }

  const {
    status = 'info',
    error = undefined,
    title = undefined,
    subTitle = undefined,
    icon = undefined,
  } = defineProps<Props>();

  const iconMap = {
    'success': 'i-fluent-checkmark-circle-16-filled',
    'error': 'i-fluent-dismiss-circle-16-filled',
    'info': 'i-fluent-info-16-filled',
    'warning': 'i-fluent-warning-16-filled',
    '404': 'i-fluent-dismiss-circle-16-filled',
    '403': 'i-fluent-dismiss-circle-16-filled',
  };

  const computedStatus = computed(() => {
    if (error?.statusCode) {
      switch (error.statusCode) {
        case 404:
          return '404';
        case 403:
          return '403';
        default:
          return 'error';
      }
    }

    return status;
  });

  const computedTitle = computed(() => {
    if (title) {
      return title;
    }

    if (error) {
      return error.statusMessage || `Ошибка ${error.statusCode || ''}`;
    }

    return '';
  });

  const computedSubTitle = computed(() => {
    if (subTitle) {
      return subTitle;
    }

    if (error) {
      return error.message || '';
    }

    return '';
  });

  const statusIcon = computed(
    () => icon || iconMap[status] || 'i-fluent-info-16-filled',
  );

  const statusColor = computed(() => {
    switch (computedStatus.value) {
      case 'success':
        return 'text-success';
      case 'error':
      case '404':
      case '403':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-info';
    }
  });
</script>

<template>
  <div
    class="mx-auto flex max-w-md flex-col items-center gap-4 p-4 text-center"
  >
    <UIcon
      :name="statusIcon"
      class="size-16"
      :class="statusColor"
    />

    <h3
      v-if="computedTitle"
      class="text-2xl font-semibold"
    >
      {{ computedTitle }}
    </h3>

    <p
      v-if="computedSubTitle"
      class="text-secondary"
    >
      {{ computedSubTitle }}
    </p>

    <div class="flex gap-2">
      <slot name="extra" />
    </div>
  </div>
</template>
