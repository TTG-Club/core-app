<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  import {
    SOURCE_OFFICIALITIES_DATA_KEY,
    SOURCE_OFFICIALITY_SELECT_PLACEHOLDER,
  } from '../../types';

  const model = defineModel<string>();

  const { data: officialities, status } = await useAsyncData(
    SOURCE_OFFICIALITIES_DATA_KEY,
    () => DictionaryService.sourceOfficialities(),
    { dedupe: 'defer' },
  );

  const officialityOptions = computed(() => officialities.value ?? []);

  const isPending = computed(() => status.value === 'pending');
</script>

<template>
  <USelect
    v-model="model"
    :placeholder="SOURCE_OFFICIALITY_SELECT_PLACEHOLDER"
    :loading="isPending"
    :items="officialityOptions"
  />
</template>
