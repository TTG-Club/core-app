<script setup lang="ts">
  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<number | Array<number>>();

  const items = Array.from(Array(10)).map((_, index) => ({
    label: !index ? 'Заговор' : `${index} круг`,
    value: index,
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
