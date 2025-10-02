<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-armor-type',
    () => DictionaryService.armorType(),
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
    placeholder="Выбери категорию доспеха"
    show-search
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
