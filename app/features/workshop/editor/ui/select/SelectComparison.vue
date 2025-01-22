<script setup lang="ts">
  import { Comparison } from '~/shared/enums';
  import type { SelectOption } from '~/shared/types';

  defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<Comparison>();

  const options: Array<SelectOption> = [
    {
      label: 'Меньше',
      value: Comparison.LESS,
    },
    {
      label: 'Меньше или равно',
      value: Comparison.LESS_OR_EQUAL,
    },
    {
      label: 'Не равно',
      value: Comparison.NOT_EQUAL,
    },
    {
      label: 'Равно',
      value: Comparison.EQUAL,
    },
    {
      label: 'Больше или равно',
      value: Comparison.GREATER_OR_EQUAL,
    },
    {
      label: 'Больше',
      value: Comparison.GREATER,
    },
  ];
</script>

<template>
  <ASelect
    v-model:value="model"
    :options="options"
    :disabled
    placeholder="Выбери тип цены"
    show-search
    allow-clear
  />
</template>
