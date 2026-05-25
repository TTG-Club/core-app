<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { disabled } = defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<string>();

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
    placeholder="Выбери тип атаки"
    clearable
    :loading="status === 'pending'"
    :items="data || []"
    :disabled="disabled"
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
