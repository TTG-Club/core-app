<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { disabled } = defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-comparison-operators',
    () => DictionaryService.comparisonOperators(),
    { dedupe: 'defer' },
  );

  function handleDropdownOpening(state: boolean) {
    if (!state) {
      return;
    }

    refresh();
  }
</script>

<template>
  <USelect
    v-model="model"
    :loading="status === 'pending'"
    :items="data || []"
    :disabled="disabled"
    placeholder="Выбери тип цены"
    searchable
    clearable
    @open="handleDropdownOpening(true)"
  />
</template>
