<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { multiple = false } = defineProps<{
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-item-type',
    () => DictionaryService.itemType(),
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };
</script>

<template>
  <UFormField
    label="Типы предмета"
    tooltip="Введите типы"
    name="types"
  >
    <USelect
      v-model:value="model"
      :mode="multiple ? 'multiple' : undefined"
      :loading="status === 'pending'"
      :options="data || []"
      placeholder="Выбери типы"
      show-search
      show-arrow
      @dropdown-visible-change="handleDropdownOpening"
    />
  </UFormField>
</template>
