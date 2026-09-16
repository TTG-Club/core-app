<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const {
    multiple = false,
    disabled,
    placeholder = '',
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;

    /** Подпись пустого поля; пусто — общая. */
    placeholder?: string;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-weapon-mastery',
    () => DictionaryService.weaponMastery(),
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
    :placeholder="placeholder || `Выбери приём${multiple ? 'ы' : ''} оружия`"
    :loading="status === 'pending'"
    :items="data || []"
    :multiple="multiple"
    :disabled="disabled"
    clearable
    searchable
    @open="handleDropdownOpening(true)"
  />
</template>
