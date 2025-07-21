<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-time-units',
    () => DictionaryService.timeUnits(),
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
    :disabled
    placeholder="Выбери единицу времени"
    searchable
    clearable
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
