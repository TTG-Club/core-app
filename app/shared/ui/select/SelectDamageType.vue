<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  import {
    DAMAGE_TYPE_SELECT_MULTIPLE_PLACEHOLDER,
    DAMAGE_TYPE_SELECT_PLACEHOLDER,
    DAMAGE_TYPES_DATA_KEY,
  } from './constants';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data: damageTypes, status } = await useAsyncData(
    DAMAGE_TYPES_DATA_KEY,
    () => DictionaryService.damageTypes(),
    { dedupe: 'defer' },
  );

  const damageTypeOptions = computed(() => damageTypes.value ?? []);

  const isPending = computed(() => status.value === 'pending');

  const placeholder = computed(() =>
    multiple
      ? DAMAGE_TYPE_SELECT_MULTIPLE_PLACEHOLDER
      : DAMAGE_TYPE_SELECT_PLACEHOLDER,
  );
</script>

<template>
  <USelect
    v-model="model"
    :placeholder="placeholder"
    :multiple="multiple"
    :loading="isPending"
    :items="damageTypeOptions"
    :disabled="disabled"
  />
</template>
