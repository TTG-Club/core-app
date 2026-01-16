<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  import type { AbilityKey } from '~/shared/types';

  const { multiple = false, limit = 0 } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    limit?: number;
  }>();

  const model = defineModel<AbilityKey | Array<AbilityKey>>();

  const { data, refresh } = await useAsyncData(
    'dictionaries-abilities',
    () => DictionaryService.abilities(),
    { dedupe: 'defer' },
  );

  const options = computed(() => {
    if (!data.value) {
      return [];
    }

    const disabled = !!model.value && !!limit && model.value.length >= limit;

    return data.value.map((ability) => ({
      ...ability,
      disabled: disabled && !model.value?.includes(ability.value),
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
    :placeholder="`Выбери характеристик${multiple ? 'и' : 'у'}`"
    :multiple="multiple"
    :items="options"
    :disabled="disabled"
    clearable
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
