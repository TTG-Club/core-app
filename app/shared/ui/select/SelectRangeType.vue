<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-range-types',
    () => DictionaryService.rangeTypes(),
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
    :multiple="multiple"
    :disabled="disabled"
    placeholder="Выбери единицу дистанции"
    searchable
    clearable
    @open="handleDropdownOpening(true)"
  />
</template>
