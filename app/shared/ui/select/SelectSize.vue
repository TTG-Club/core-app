<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const {
    multiple = false,
    disabledKeys = [],
    disabled,
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    disabledKeys?: Array<string>;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-sizes',
    () => DictionaryService.sizes(),
    { dedupe: 'defer' },
  );

  const options = computed(() => {
    if (!data.value?.length) {
      return [];
    }

    return data.value.map((size) => ({
      ...size,
      disabled: disabledKeys.includes(size.value),
    }));
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
    :items="options"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери размер${multiple ? 'ы' : ''}`"
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
