<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false } = defineProps<{
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-item-types',
    () => DictionaryService.itemTypes(),
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };
</script>

<template>
  <USelect
    v-model="model"
    :multiple="multiple"
    :loading="status === 'pending'"
    :items="data || []"
    placeholder="Выбери типы"
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
