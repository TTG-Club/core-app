<script setup lang="ts">
  import { range } from 'es-toolkit';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<number | Array<number>>();

  const items = range(1, 21).map((level) => ({
    label: `${level}-й уровень`,
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
