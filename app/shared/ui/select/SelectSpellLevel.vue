<script setup lang="ts">
  import { range } from 'lodash-es';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<number | Array<number>>();

  const items = range(0, 10).map((level) => ({
    label: !level ? 'Заговор' : `${level} круг`,
    value: level,
  }));
</script>

<template>
  <USelect
    v-model="model"
    :placeholder="`Выбери уров${multiple ? 'ни' : 'ень'}`"
    :multiple="multiple"
    :disabled="disabled"
    :items
    searchable
  />
</template>
