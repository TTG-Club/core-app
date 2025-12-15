<script setup lang="ts">
  import { range } from 'es-toolkit';

  const {
    multiple = false,
    disabled,
    max = 20,
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    max?: number;
  }>();

  const model = defineModel<number | Array<number>>();

  const items = computed(() =>
    range(1, Math.min(max, 20) + 1).map((level) => ({
      label: `${level}-й уровень`,
      value: level,
    })),
  );
</script>

<template>
  <USelect
    v-model="model"
    :placeholder="`Выбери уров${multiple ? 'ни' : 'ень'}`"
    :multiple="multiple"
    :disabled="disabled"
    :items="items"
    searchable
  />
</template>
