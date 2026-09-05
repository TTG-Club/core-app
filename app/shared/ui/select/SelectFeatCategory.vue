<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { disabled = false, multiple = false } = defineProps<{
    disabled?: boolean;

    /** Несколько категорий сразу: так задаётся пул выбора черты в механике. */
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-feat-categories',
    () => DictionaryService.featCategories(),
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
    :multiple="multiple"
    placeholder="Выбери категорию черты"
    searchable
    clearable
    @open="handleDropdownOpening(true)"
  />
</template>
