<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-treasures',
    () => DictionaryService.treasures(),
    { dedupe: 'defer' },
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
    :placeholder="`Выбери сокровищ${multiple ? 'а' : 'е'}`"
    :loading="status === 'pending'"
    :multiple="multiple"
    :items="data || []"
    :disabled
    max-tag-count="responsive"
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
