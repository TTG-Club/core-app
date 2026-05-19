<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-attack-types',
    () => DictionaryService.attackTypes(),
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
    :placeholder="`Выбери \u0442\u0438\u043F${multiple ? '\u044B' : ''} \u0430\u0442\u0430\u043A\u0438`"
    :multiple="multiple"
    :loading="status === 'pending'"
    :items="data || []"
    :disabled="disabled"
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
