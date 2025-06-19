<script setup lang="ts">
  import { UiResult } from '~ui/result';

  import type { NuxtError } from '#app';

  defineProps<{
    items: Array<unknown> | undefined;
    status?: string;
    error?: NuxtError;
  }>();

  defineEmits<{
    (e: 'refresh'): void;
  }>();
</script>

<template>
  <UiResult
    v-if="status === 'success' && !items?.length"
    title="Ничего не нашлось"
    sub-title="По вашему запросу ничего не нашлось. Попробуйте изменить фильтр или строку поиска"
  >
    <template #extra>
      <UButton @click.left.exact.prevent="$emit('refresh')"> Обновить </UButton>

      <UButton
        variant="soft"
        @click.left.exact.prevent="navigateTo('/')"
      >
        Вернуться на главную
      </UButton>
    </template>
  </UiResult>

  <UiResult
    v-else-if="error"
    :error
  >
    <template #extra>
      <UButton @click.left.exact.prevent="$emit('refresh')"> Обновить </UButton>

      <UButton
        variant="soft"
        @click.left.exact.prevent="navigateTo('/')"
      >
        Вернуться на главную
      </UButton>
    </template>
  </UiResult>
</template>
