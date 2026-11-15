<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false } = defineProps<{
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-source-categories',
    () => DictionaryService.sourceCategories(),
  );

  const placeholder = computed(() => {
    if (multiple) {
      return 'Выбери категории источника';
    }

    return 'Выбери категорию источника';
  });

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
    :placeholder
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
