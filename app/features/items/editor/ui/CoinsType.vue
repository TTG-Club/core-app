<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-coins-type',
    () => DictionaryService.coinType(),
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
    label="Номинал монет"
    tooltip="Выберите номинал"
    name="coin"
  >
    <USelect
      v-model:value="model"
      :loading="status === 'pending'"
      :options="data || []"
      :disabled
      placeholder="Выбери типы"
      show-search
      @dropdown-visible-change="handleDropdownOpening"
    />
  </UFormField>
</template>
