<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-alignments',
    () => DictionaryService.alignments(),
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
    :placeholder="`Выбери мировоззрени${multiple ? 'я' : 'е'}`"
    :multiple="multiple"
    :loading="status === 'pending'"
    :items="data || []"
    :disabled="disabled"
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
