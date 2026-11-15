<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  import {
    SOURCE_CATEGORIES_DATA_KEY,
    SOURCE_CATEGORY_SELECT_PLACEHOLDER,
  } from '../../types';

  const model = defineModel<string>();

  const { data: categories, status } = await useAsyncData(
    SOURCE_CATEGORIES_DATA_KEY,
    () => DictionaryService.sourceCategories(),
    { dedupe: 'defer' },
  );

  const categoryOptions = computed(() => categories.value ?? []);

  const isPending = computed(() => status.value === 'pending');
</script>

<template>
  <USelect
    v-model="model"
    :placeholder="SOURCE_CATEGORY_SELECT_PLACEHOLDER"
    :loading="isPending"
    :items="categoryOptions"
  />
</template>
