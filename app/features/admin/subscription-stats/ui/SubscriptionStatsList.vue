<script setup lang="ts">
  import { SUBSCRIPTION_STATS_LIST_SKELETON_COUNT } from '../model';

  defineProps<{
    isPending: boolean;
    isEmpty: boolean;
    emptyText: string;
    /** Сообщение вместо списка, когда данные не пришли */
    errorText?: string;
  }>();

  defineSlots<{
    /** Строки списка (`li`) */
    default: () => unknown;
  }>();
</script>

<template>
  <ul
    v-if="isPending"
    class="divide-y divide-default"
  >
    <li
      v-for="index in SUBSCRIPTION_STATS_LIST_SKELETON_COUNT"
      :key="index"
      class="px-4 py-2.5"
    >
      <USkeleton class="h-5 w-full" />
    </li>
  </ul>

  <p
    v-else-if="errorText"
    class="px-4 py-3 text-sm text-error"
    role="status"
  >
    {{ errorText }}
  </p>

  <p
    v-else-if="isEmpty"
    class="px-4 py-3 text-sm text-muted"
  >
    {{ emptyText }}
  </p>

  <ul
    v-else
    class="divide-y divide-default"
  >
    <slot />
  </ul>
</template>
