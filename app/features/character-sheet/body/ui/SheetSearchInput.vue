<script setup lang="ts">
  import type { InputProps } from '@nuxt/ui';

  import { SHEET_SEARCH_LABELS } from '../../model';

  // Поиск модалок добавления: единый инпут с крестиком быстрой очистки —
  // крестик появляется только при непустом запросе, как в остальных поисках.
  withDefaults(
    defineProps<{
      placeholder?: string;
      size?: InputProps['size'];
    }>(),
    { placeholder: SHEET_SEARCH_LABELS.placeholder, size: 'md' },
  );

  const searchTerm = defineModel<string>({ required: true });

  function handleClear() {
    searchTerm.value = '';
  }
</script>

<template>
  <UInput
    v-model="searchTerm"
    icon="tabler:search"
    :placeholder="placeholder"
    :size="size"
    :ui="{ trailing: 'pe-0.5' }"
  >
    <template
      v-if="searchTerm"
      #trailing
    >
      <UButton
        icon="tabler:x"
        variant="link"
        color="neutral"
        size="sm"
        :aria-label="SHEET_SEARCH_LABELS.clear"
        @click.left.exact.prevent="handleClear"
      />
    </template>
  </UInput>
</template>
