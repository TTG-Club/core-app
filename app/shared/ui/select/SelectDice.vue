<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const {
    multiple = false,
    disabled,
    placeholder = 'Выбери кость',
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    placeholder?: string;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-dices',
    () => DictionaryService.dices(),
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
    :loading="status === 'pending'"
    :items="data || []"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="placeholder"
    clearable
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
