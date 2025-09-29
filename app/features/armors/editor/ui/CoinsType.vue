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
  <USelect
    v-model="model"
    :loading="status === 'pending'"
    :items="data || []"
    :disabled
    placeholder="Выбери тип монет"
    show-search
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
