<script setup lang="ts">
  import { FILTER_SEARCH_CLEAR_LABEL } from '../model';

  // Единое поле поиска фильтров: тулбар раздела и дровер отличаются только
  // плейсхолдером и иконкой, а крестик быстрой очистки одинаков — как в
  // остальных поисках проекта, он появляется только при непустом запросе.
  const { placeholder, icon = undefined } = defineProps<{
    placeholder: string;
    icon?: string;
  }>();

  const search = defineModel<string>({ required: true });

  function handleClear(): void {
    search.value = '';
  }
</script>

<template>
  <UInput
    v-model="search"
    :placeholder
    :icon
    :ui="{ trailing: 'pe-0.5' }"
  >
    <template
      v-if="search"
      #trailing
    >
      <UButton
        icon="tabler:x"
        variant="link"
        color="neutral"
        size="sm"
        :aria-label="FILTER_SEARCH_CLEAR_LABEL"
        @click.left.exact.prevent="handleClear"
      />
    </template>
  </UInput>
</template>
